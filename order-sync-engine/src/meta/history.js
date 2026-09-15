import fs from 'node:fs';
import path from 'node:path';
import { MetaAdsClient } from './client.js';
import { ShopifyClient } from '../shopify/client.js';
import { ShopifyOrderManager } from '../shopify/orders.js';
import { config } from '../config.js';

const CACHE_FILE = path.join(config.dataDir, 'history-30d-cache.json');
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export class HistoricalAnalyticsManager {
  constructor() {
    this.meta = new MetaAdsClient();
    this.shopify = new ShopifyOrderManager(new ShopifyClient());
  }

  async getDailyHistory30Days(forceRefresh = false) {
    // Check cache
    if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
      try {
        const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_EXPIRY_MS && cached.data && cached.data.length > 0) {
          return cached.data;
        }
      } catch (e) {
        // ignore cache read error
      }
    }

    console.log('[History] Fetching 30 days historical data from Meta and Shopify...');

    // 1. Fetch Meta 30 days daily breakdown (limit 100) + Today's insights
    const [metaRes, todayInsights] = await Promise.all([
      this.meta.fetch(`${this.meta.adAccountId}/insights`, {
        date_preset: 'last_30d',
        time_increment: 1,
        limit: 100,
        fields: 'spend,impressions,clicks,cpc,cpm,ctr,actions,purchase_roas',
      }),
      this.meta.getInsights('today'),
    ]);

    const metaByDay = {};

    // Populate historical days
    for (const row of metaRes.data || []) {
      const date = row.date_start;
      const baseSpend = parseFloat(row.spend || '0');
      const gstAmount = Math.round(baseSpend * 0.18 * 100) / 100;
      const spendWithGST = Math.round((baseSpend + gstAmount) * 100) / 100;
      
      const purchaseAction = (row.actions || []).find(a => 
        a.action_type === 'purchase' || a.action_type === 'omni_purchase'
      );
      const purchases = purchaseAction ? parseInt(purchaseAction.value, 10) : 0;

      metaByDay[date] = {
        date,
        baseSpend,
        gstAmount,
        spendWithGST,
        impressions: parseInt(row.impressions || '0', 10),
        clicks: parseInt(row.clicks || '0', 10),
        cpc: parseFloat(row.cpc || '0'),
        cpm: parseFloat(row.cpm || '0'),
        ctr: parseFloat(row.ctr || '0'),
        metaPurchases: purchases,
      };
    }

    // Add/overwrite today
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    metaByDay[todayIST] = {
      date: todayIST,
      baseSpend: todayInsights.baseSpend,
      gstAmount: todayInsights.gstAmount,
      spendWithGST: todayInsights.spendWithGST,
      impressions: todayInsights.impressions,
      clicks: todayInsights.clicks,
      cpc: todayInsights.cpc,
      cpm: todayInsights.cpm,
      ctr: todayInsights.ctr,
      metaPurchases: todayInsights.purchases,
    };

    // 2. Fetch Shopify Orders for last 31 days
    const d30 = new Date(Date.now() - 31 * 86400000);
    const d30Str = d30.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const shopifyOrders = await this.shopify.fetchAllOrders({
      created_at_min: `${d30Str}T00:00:00+05:30`,
      limit: 250,
    });

    // Group Shopify orders by Asia/Kolkata date
    const shopifyByDay = {};
    for (const o of shopifyOrders) {
      if (o.cancelled_at) continue;
      const day = new Date(o.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      if (!shopifyByDay[day]) {
        shopifyByDay[day] = {
          ordersCount: 0,
          totalRevenue: 0,
          codOrders: 0,
          codRevenue: 0,
          prepaidOrders: 0,
          prepaidRevenue: 0,
          orders: [],
        };
      }
      shopifyByDay[day].ordersCount++;
      shopifyByDay[day].totalRevenue += o.total_price;
      if (o.is_cod) {
        shopifyByDay[day].codOrders++;
        shopifyByDay[day].codRevenue += o.total_price;
      } else {
        shopifyByDay[day].prepaidOrders++;
        shopifyByDay[day].prepaidRevenue += o.total_price;
      }
      shopifyByDay[day].orders.push({
        name: o.name,
        customerName: o.customer.name,
        city: o.shipping_address.city,
        payment_mode: o.payment_mode,
        total_price: o.total_price,
      });
    }

    // 3. Merge by all unique dates in descending order
    const allDates = Array.from(new Set([...Object.keys(metaByDay), ...Object.keys(shopifyByDay)])).sort().reverse();

    const merged = allDates.map(date => {
      const m = metaByDay[date] || {
        date,
        baseSpend: 0,
        gstAmount: 0,
        spendWithGST: 0,
        impressions: 0,
        clicks: 0,
        cpc: 0,
        cpm: 0,
        ctr: 0,
        metaPurchases: 0,
      };

      const s = shopifyByDay[date] || {
        ordersCount: 0,
        totalRevenue: 0,
        codOrders: 0,
        codRevenue: 0,
        prepaidOrders: 0,
        prepaidRevenue: 0,
        orders: [],
      };

      const spendWithGST = m.spendWithGST;
      const totalRevenue = Math.round(s.totalRevenue * 100) / 100;
      const blendedRoas = spendWithGST > 0 ? parseFloat((totalRevenue / spendWithGST).toFixed(2)) : 0;
      const cpo = s.ordersCount > 0 && spendWithGST > 0 ? parseFloat((spendWithGST / s.ordersCount).toFixed(2)) : 0;
      const aov = s.ordersCount > 0 ? parseFloat((totalRevenue / s.ordersCount).toFixed(2)) : 0;

      return {
        date,
        meta: m,
        shopify: s,
        blendedRoas,
        cpo,
        aov,
      };
    });

    // Save cache
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data: merged }, null, 2), 'utf8');
    } catch (e) {
      // ignore
    }

    return merged;
  }
}
