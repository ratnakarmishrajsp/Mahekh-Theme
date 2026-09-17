import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLiveMetrics, getISTDateString } from './live-roas.js';
import { HistoricalAnalyticsManager } from '../meta/history.js';
import { MetaAdsClient } from '../meta/client.js';
import { config } from '../config.js';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const themeRoot = path.resolve(config.rootDir, '..');
const TOKEN_REFRESH_FILE = path.join(config.dataDir, 'token-auto-refresh.json');

let lastOrdersSummary = '';
let lastSpendSummary = '';

async function autoRefreshMetaTokenIfNeeded() {
  try {
    let metaData = { lastRefreshed: 0 };
    if (fs.existsSync(TOKEN_REFRESH_FILE)) {
      try {
        metaData = JSON.parse(fs.readFileSync(TOKEN_REFRESH_FILE, 'utf8'));
      } catch {}
    }

    const now = Date.now();
    const daysSince = (now - (metaData.lastRefreshed || 0)) / (1000 * 60 * 60 * 24);

    // Automatically re-exchange every 15 days so the 60-day token rolls over perpetually
    if (daysSince >= 15) {
      const client = new MetaAdsClient();
      const currentToken = process.env.META_ACCESS_TOKEN || config.meta?.accessToken;
      if (currentToken) {
        const res = await client.exchangeForLongLivedToken(currentToken);
        if (res && res.access_token) {
          process.env.META_ACCESS_TOKEN = res.access_token;
          const envPath = path.join(config.rootDir, '.env');
          if (fs.existsSync(envPath)) {
            let content = fs.readFileSync(envPath, 'utf8');
            content = content.replace(/META_ACCESS_TOKEN=.*/g, `META_ACCESS_TOKEN=${res.access_token}`);
            fs.writeFileSync(envPath, content, 'utf8');
          }
          fs.writeFileSync(TOKEN_REFRESH_FILE, JSON.stringify({ lastRefreshed: now, expires_in: res.expires_in }, null, 2), 'utf8');
          console.log(`[Daemon] 🔄 Meta Token perpetually auto-renewed for another 60 days (expires in: ${Math.round(res.expires_in / 86400)} days)!`);
        }
      }
    }
  } catch (err) {
    // Non-fatal notice
  }
}

async function syncOnce() {
  await autoRefreshMetaTokenIfNeeded();

  const todayIST = getISTDateString(0);
  const yesterdayIST = getISTDateString(-1);

  console.log(`\n[Daemon ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST] Checking live Shopify & Meta data...`);

  const historyMgr = new HistoricalAnalyticsManager();
  const historyList = await historyMgr.getDailyHistory30Days();

  const [todayMetrics, yesterdayMetrics] = await Promise.all([
    getLiveMetrics('today'),
    getLiveMetrics('yesterday'),
  ]);

  const currentOrdersSummary = `T:${todayMetrics.shopify.totalOrders}-Y:${yesterdayMetrics.shopify.totalOrders}-${yesterdayMetrics.shopify.totalSales}`;
  const currentSpendSummary = `T:${todayMetrics.meta.spendWithGST}-Y:${yesterdayMetrics.meta.spendWithGST}`;

  // Update today and yesterday in historyList
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

  if (todayIdx >= 0) historyList[todayIdx] = todayEntry;
  else historyList.unshift(todayEntry);

  const yesterdayIdx = historyList.findIndex((h) => h.date === yesterdayIST);
  const yesterdayEntry = {
    date: yesterdayIST,
    meta: {
      date: yesterdayIST,
      baseSpend: yesterdayMetrics.meta.baseSpend,
      gstAmount: yesterdayMetrics.meta.gstAmount,
      spendWithGST: yesterdayMetrics.meta.spendWithGST,
      impressions: yesterdayMetrics.meta.impressions,
      clicks: yesterdayMetrics.meta.clicks,
      cpc: yesterdayMetrics.meta.cpc,
      cpm: yesterdayMetrics.meta.cpm,
      ctr: yesterdayMetrics.meta.ctr,
      metaPurchases: yesterdayMetrics.meta.metaReportedPurchases,
    },
    shopify: {
      ordersCount: yesterdayMetrics.shopify.totalOrders,
      totalRevenue: yesterdayMetrics.shopify.totalSales,
      codOrders: yesterdayMetrics.shopify.codOrders,
      codRevenue: yesterdayMetrics.shopify.codSales,
      prepaidOrders: yesterdayMetrics.shopify.prepaidOrders,
      prepaidRevenue: yesterdayMetrics.shopify.prepaidSales,
      aov: yesterdayMetrics.shopify.aov,
      orders: yesterdayMetrics.shopify.orders.map((o) => ({
        name: o.name,
        customerName: o.customerName,
        city: o.city,
        payment_mode: o.payment_mode,
        total_price: o.total_price,
      })),
    },
    blendedRoas: yesterdayMetrics.blended.grossRoas,
    cpo: yesterdayMetrics.blended.costPerOrder,
    aov: yesterdayMetrics.shopify.aov,
  };

  if (yesterdayIdx >= 0) historyList[yesterdayIdx] = yesterdayEntry;
  else historyList.push(yesterdayEntry);

  historyList.sort((a, b) => b.date.localeCompare(a.date));

  // Write to main-roas-dashboard.liquid
  const liquidPath = path.join(themeRoot, 'sections', 'main-roas-dashboard.liquid');
  if (fs.existsSync(liquidPath)) {
    let content = fs.readFileSync(liquidPath, 'utf8');
    const regex = /const EMBEDDED_FALLBACK_HISTORY = \[[\s\S]*?\];/;
    const replacement = `const EMBEDDED_FALLBACK_HISTORY = ${JSON.stringify(historyList)};`;
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      fs.writeFileSync(liquidPath, content, 'utf8');
    }
  }

  const hasChanged = currentOrdersSummary !== lastOrdersSummary || currentSpendSummary !== lastSpendSummary;
  lastOrdersSummary = currentOrdersSummary;
  lastSpendSummary = currentSpendSummary;

  console.log(`[Daemon] Verified: Today=${todayMetrics.shopify.totalOrders} orders, Yesterday=${yesterdayMetrics.shopify.totalOrders} orders (₹${yesterdayMetrics.shopify.totalSales})`);

  let statusOutput = '';
  try {
    statusOutput = execSync('git status --porcelain sections/main-roas-dashboard.liquid', { cwd: themeRoot, encoding: 'utf8' }).trim();
  } catch {}

  if (statusOutput) {
    try {
      console.log('[Daemon] New data changes detected. Committing and pushing to GitHub so Shopify theme updates live...');
      execSync('git add sections/main-roas-dashboard.liquid', { cwd: themeRoot, stdio: 'inherit' });
      execSync(`git commit -m "Auto-sync live data: Today ${todayMetrics.shopify.totalOrders} orders, Yesterday ${yesterdayMetrics.shopify.totalOrders} orders"`, { cwd: themeRoot, stdio: 'inherit' });
      execSync('git push origin main', { cwd: themeRoot, stdio: 'inherit' });
      console.log('[Daemon] ✅ Successfully pushed update to Shopify GitHub branch.');
    } catch (gitErr) {
      console.warn('[Daemon] Git commit/push notice:', gitErr.message);
    }
  }
}

async function runDaemon() {
  console.log('======================================================');
  console.log('   MAHEKH AUTOMATED LIVE DATA SYNC DAEMON STARTED');
  console.log('   Polls Shopify & Meta every 2 minutes');
  console.log('   Auto-pushes to GitHub for live Shopify theme updates');
  console.log('======================================================');

  await syncOnce();
  setInterval(async () => {
    try {
      await syncOnce();
    } catch (err) {
      console.error('[Daemon Error]', err.message);
    }
  }, 2 * 60 * 1000);
}

runDaemon().catch(console.error);
