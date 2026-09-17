import fs from 'node:fs';
import path from 'node:path';
import { MetaAdsClient } from './client.js';
import { ShopifyClient } from '../shopify/client.js';
import { ShopifyOrderManager } from '../shopify/orders.js';
import { adSpendStore } from './spend-store.js';
import { getISTDateString } from '../cli/live-roas.js';
import { config } from '../config.js';

const CACHE_FILE = path.join(config.dataDir, 'history-30d-cache.json');
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export class HistoricalAnalyticsManager {
  constructor() {
    this.meta = new MetaAdsClient();
    this.shopify = new ShopifyOrderManager(new ShopifyClient());
  }

  async getDailyHistory30Days(forceFullRefresh = false) {
    const todayIST = getISTDateString(0);
    const yesterdayIST = getISTDateString(-1);

    let cached = null;
    if (fs.existsSync(CACHE_FILE)) {
      try {
        cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      } catch (e) {
        cached = null;
      }
    }

    // Fast Path: Incremental Update (if cache exists and not forcing 30-day rebuild)
    if (!forceFullRefresh && cached && Array.isArray(cached.data) && cached.data.length > 0) {
      console.log('[History] Quick incremental sync for recent days (Yesterday & Today)...');

      // 1. Fetch orders for yesterday and today only (~1 second)
      const recentMinStr = getISTDateString(-2);
      const recentOrders = await this.shopify.fetchAllOrders({
        created_at_min: `${recentMinStr}T00:00:00+05:30`,
        limit: 100,
      });

      // Group recent orders by Asia/Kolkata date
      const recentShopifyByDay = {};
      for (const o of recentOrders) {
        if (o.cancelled_at) continue;
        const day = new Date(o.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        if (!recentShopifyByDay[day]) {
          recentShopifyByDay[day] = {
            ordersCount: 0,
            totalRevenue: 0,
            codOrders: 0,
            codRevenue: 0,
            prepaidOrders: 0,
            prepaidRevenue: 0,
            orders: [],
          };
        }
        recentShopifyByDay[day].ordersCount++;
        recentShopifyByDay[day].totalRevenue += o.total_price;
        if (o.is_cod) {
          recentShopifyByDay[day].codOrders++;
          recentShopifyByDay[day].codRevenue += o.total_price;
        } else {
          recentShopifyByDay[day].prepaidOrders++;
          recentShopifyByDay[day].prepaidRevenue += o.total_price;
        }
        recentShopifyByDay[day].orders.push({
          name: o.name,
          customerName: o.customer.name,
          city: o.shipping_address.city,
          payment_mode: o.payment_mode,
          total_price: o.total_price,
        });
      }

      // Check if live Meta can be fetched for today & yesterday
      let todayMetaInsights = null;
      let yesterdayMetaInsights = null;
      try {
        [todayMetaInsights, yesterdayMetaInsights] = await Promise.all([
          this.meta.getInsights('today').catch(() => null),
          this.meta.getInsights('yesterday').catch(() => null),
        ]);
      } catch {
        // Safe fallback
      }

      // Map existing records into a dictionary
      const historyMap = new Map();
      for (const item of cached.data) {
        historyMap.set(item.date, item);
      }

      // Update days that were fetched
      for (const day of [todayIST, yesterdayIST, recentMinStr]) {
        const s = recentShopifyByDay[day] || {
          ordersCount: 0,
          totalRevenue: 0,
          codOrders: 0,
          codRevenue: 0,
          prepaidOrders: 0,
          prepaidRevenue: 0,
          orders: [],
        };

        // Determine Meta spend for this day
        let m = null;
        const liveInsight = day === todayIST ? todayMetaInsights : (day === yesterdayIST ? yesterdayMetaInsights : null);
        if (liveInsight) {
          m = {
            date: day,
            baseSpend: liveInsight.baseSpend,
            gstAmount: liveInsight.gstAmount,
            spendWithGST: liveInsight.spendWithGST,
            impressions: liveInsight.impressions,
            clicks: liveInsight.clicks,
            cpc: liveInsight.cpc,
            cpm: liveInsight.cpm,
            ctr: liveInsight.ctr,
            metaPurchases: liveInsight.purchases,
          };
          adSpendStore.setSpend(day, {
            baseSpend: liveInsight.baseSpend,
            spendWithGST: liveInsight.spendWithGST,
            impressions: liveInsight.impressions,
            clicks: liveInsight.clicks,
            metaPurchases: liveInsight.purchases,
            isManual: false,
          });
        } else {
          const stored = adSpendStore.getSpend(day);
          const existingItem = historyMap.get(day);
          m = {
            date: day,
            baseSpend: stored?.baseSpend ?? existingItem?.meta?.baseSpend ?? 0,
            gstAmount: stored?.gstAmount ?? existingItem?.meta?.gstAmount ?? 0,
            spendWithGST: stored?.spendWithGST ?? existingItem?.meta?.spendWithGST ?? 0,
            impressions: stored?.impressions ?? existingItem?.meta?.impressions ?? 0,
            clicks: stored?.clicks ?? existingItem?.meta?.clicks ?? 0,
            cpc: existingItem?.meta?.cpc ?? 0,
            cpm: existingItem?.meta?.cpm ?? 0,
            ctr: existingItem?.meta?.ctr ?? 0,
            metaPurchases: stored?.metaPurchases ?? existingItem?.meta?.metaPurchases ?? 0,
          };
        }

        const spendWithGST = m.spendWithGST;
        const totalRevenue = Math.round(s.totalRevenue * 100) / 100;
        const blendedRoas = spendWithGST > 0 ? parseFloat((totalRevenue / spendWithGST).toFixed(2)) : 0;
        const cpo = s.ordersCount > 0 && spendWithGST > 0 ? parseFloat((spendWithGST / s.ordersCount).toFixed(2)) : 0;
        const aov = s.ordersCount > 0 ? parseFloat((totalRevenue / s.ordersCount).toFixed(2)) : 0;

        historyMap.set(day, {
          date: day,
          meta: m,
          shopify: s,
          blendedRoas,
          cpo,
          aov,
        });
      }

      const updatedList = Array.from(historyMap.values()).sort((a, b) => b.date.localeCompare(a.date));

      try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data: updatedList }, null, 2), 'utf8');
      } catch (e) {
        // ignore write error
      }

      return updatedList;
    }

    // Full 30-Day Sync (only runs if no cache exists or explicitly forced)
    console.log('[History] Performing full 30 days sync from Meta and Shopify...');

    let metaRes = { data: [] };
    let todayInsights = { baseSpend: 0, gstAmount: 0, spendWithGST: 0 };
    try {
      [metaRes, todayInsights] = await Promise.all([
        this.meta.fetch(`${this.meta.adAccountId}/insights`, {
          date_preset: 'last_30d',
          time_increment: 1,
          limit: 100,
          fields: 'spend,impressions,clicks,cpc,cpm,ctr,actions,purchase_roas',
        }),
        this.meta.getInsights('today'),
      ]);
    } catch (err) {
      console.warn('[History] Meta 30d fetch failed:', err.message);
    }

    const metaByDay = {};
    for (const row of metaRes.data || []) {
      const date = row.date_start;
      const baseSpend = parseFloat(row.spend || '0');
      const gstAmount = Math.round(baseSpend * 0.18 * 100) / 100;
      const spendWithGST = Math.round((baseSpend + gstAmount) * 100) / 100;

      const purchaseAction = (row.actions || []).find((a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
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

    // Integrate stored spends
    const allStoredSpends = adSpendStore.getAllSpends();
    for (const [sDate, sObj] of Object.entries(allStoredSpends)) {
      if (!metaByDay[sDate] || sObj.isManual) {
        metaByDay[sDate] = {
          date: sDate,
          baseSpend: sObj.baseSpend,
          gstAmount: sObj.gstAmount,
          spendWithGST: sObj.spendWithGST,
          impressions: sObj.impressions,
          clicks: sObj.clicks,
          cpc: 0,
          cpm: 0,
          ctr: 0,
          metaPurchases: sObj.metaPurchases,
        };
      }
    }

    // Fetch Shopify Orders for last 31 days
    const d30Str = getISTDateString(-31);
    const shopifyOrders = await this.shopify.fetchAllOrders({
      created_at_min: `${d30Str}T00:00:00+05:30`,
      limit: 250,
    });

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

    const allDates = Array.from(new Set([...Object.keys(metaByDay), ...Object.keys(shopifyByDay)])).sort().reverse();

    const merged = allDates.map((date) => {
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

    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data: merged }, null, 2), 'utf8');
    } catch (e) {
      // ignore
    }

    return merged;
  }
}
