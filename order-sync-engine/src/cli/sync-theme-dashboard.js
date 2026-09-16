import fs from 'node:fs';
import path from 'node:path';
import { HistoricalAnalyticsManager } from '../meta/history.js';
import { getLiveMetrics, getISTDateString } from './live-roas.js';
import { config } from '../config.js';

async function syncThemeDashboard() {
  console.log('[ThemeSync] Starting sync of Shopify Liquid Theme Dashboard...');

  const historyMgr = new HistoricalAnalyticsManager();
  // Fetch latest 30-day history with yesterday & today refreshed
  const historyList = await historyMgr.getDailyHistory30Days();

  // Also get today's live metrics
  const todayMetrics = await getLiveMetrics('today');
  const todayIST = getISTDateString(0);

  // Ensure today's entry is at index 0 and fully updated
  const todayIdx = historyList.findIndex((h) => h.date === todayIST);
  const todayEntry = {
    date: todayIST,
    meta: {
      date: todayIST,
      baseSpend: todayMetrics.meta.baseSpend,
      gstAmount: todayMetrics.meta.gstAmount,
      spendWithGST: todayMetrics.meta.spendWithGST,
      impressions: todayMetrics.meta.impressions,
      clicks: todayMetrics.meta.clicks,
      cpc: todayMetrics.meta.cpc,
      cpm: todayMetrics.meta.cpm,
      ctr: todayMetrics.meta.ctr,
      metaPurchases: todayMetrics.meta.metaReportedPurchases,
    },
    shopify: {
      ordersCount: todayMetrics.shopify.totalOrders,
      totalRevenue: todayMetrics.shopify.totalSales,
      codOrders: todayMetrics.shopify.codOrders,
      codRevenue: todayMetrics.shopify.codSales,
      prepaidOrders: todayMetrics.shopify.prepaidOrders,
      prepaidRevenue: todayMetrics.shopify.prepaidSales,
      aov: todayMetrics.shopify.aov,
      orders: todayMetrics.shopify.orders.map((o) => ({
        name: o.name,
        customerName: o.customerName,
        city: o.city,
        payment_mode: o.payment_mode,
        total_price: o.total_price,
      })),
    },
    blendedRoas: todayMetrics.blended.grossRoas,
    cpo: todayMetrics.blended.costPerOrder,
    aov: todayMetrics.shopify.aov,
  };

  if (todayIdx >= 0) {
    historyList[todayIdx] = todayEntry;
  } else {
    historyList.unshift(todayEntry);
  }

  // Sort descending by date
  historyList.sort((a, b) => b.date.localeCompare(a.date));

  // Path to Liquid section
  const themeRoot = path.resolve(config.rootDir, '..');
  const liquidPath = path.join(themeRoot, 'sections', 'main-roas-dashboard.liquid');

  if (!fs.existsSync(liquidPath)) {
    throw new Error(`Liquid file not found at: ${liquidPath}`);
  }

  let content = fs.readFileSync(liquidPath, 'utf8');

  // Regex to replace EMBEDDED_FALLBACK_HISTORY
  const regex = /const EMBEDDED_FALLBACK_HISTORY = \[[\s\S]*?\];/;
  const newJsonStr = JSON.stringify(historyList);
  const replacement = `const EMBEDDED_FALLBACK_HISTORY = ${newJsonStr};`;

  if (!regex.test(content)) {
    throw new Error('Could not find EMBEDDED_FALLBACK_HISTORY in main-roas-dashboard.liquid');
  }

  content = content.replace(regex, replacement);
  fs.writeFileSync(liquidPath, content, 'utf8');

  console.log(`[ThemeSync] ✅ Successfully updated ${liquidPath}`);
  console.log(`[ThemeSync] Embedded ${historyList.length} days of verified data.`);
  console.log(`[ThemeSync] Today (${todayIST}): ${todayEntry.shopify.ordersCount} orders, ₹${todayEntry.shopify.totalRevenue} revenue`);
  const yEntry = historyList.find((h) => h.date === getISTDateString(-1));
  if (yEntry) {
    console.log(`[ThemeSync] Yesterday (${yEntry.date}): ${yEntry.shopify.ordersCount} orders, ₹${yEntry.shopify.totalRevenue} revenue, ₹${yEntry.meta.spendWithGST} spend (ROAS: ${yEntry.blendedRoas}x)`);
  }
}

syncThemeDashboard().catch(console.error);
