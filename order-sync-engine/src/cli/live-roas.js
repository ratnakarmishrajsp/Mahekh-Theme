import { MetaAdsClient } from '../meta/client.js';
import { ShopifyClient } from '../shopify/client.js';
import { ShopifyOrderManager } from '../shopify/orders.js';
import { adSpendStore } from '../meta/spend-store.js';

export function getISTDateString(dayOffset = 0) {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = istFormatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === 'year').value, 10);
  const month = parseInt(parts.find((p) => p.type === 'month').value, 10) - 1;
  const day = parseInt(parts.find((p) => p.type === 'day').value, 10);

  const istDate = new Date(Date.UTC(year, month, day + dayOffset));
  return istDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

export async function getLiveMetrics(datePreset = 'today') {
  const meta = new MetaAdsClient();
  const shopifyClient = new ShopifyClient();
  const shopifyManager = new ShopifyOrderManager(shopifyClient);

  const todayIST = getISTDateString(0);
  const yesterdayIST = getISTDateString(-1);

  let targetDateStr = todayIST;
  let createdAtMin;
  let createdAtMax;
  let isRange = false;

  if (datePreset === 'today') {
    targetDateStr = todayIST;
    createdAtMin = `${todayIST}T00:00:00+05:30`;
    createdAtMax = `${todayIST}T23:59:59+05:30`;
  } else if (datePreset === 'yesterday') {
    targetDateStr = yesterdayIST;
    createdAtMin = `${yesterdayIST}T00:00:00+05:30`;
    createdAtMax = `${yesterdayIST}T23:59:59+05:30`;
  } else if (datePreset === 'last_7d') {
    isRange = true;
    const d7 = getISTDateString(-7);
    targetDateStr = `${d7} to ${todayIST}`;
    createdAtMin = `${d7}T00:00:00+05:30`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(datePreset)) {
    // Custom date format YYYY-MM-DD
    targetDateStr = datePreset;
    createdAtMin = `${targetDateStr}T00:00:00+05:30`;
    createdAtMax = `${targetDateStr}T23:59:59+05:30`;
  } else {
    // Default fallback to today
    targetDateStr = todayIST;
    createdAtMin = `${todayIST}T00:00:00+05:30`;
  }

  // 1. Fetch Meta Insights safely (never crash on Meta error or token blockage)
  let metaInsights = null;
  let metaError = null;
  let isLiveMeta = false;

  try {
    metaInsights = await meta.getInsights(datePreset);
    isLiveMeta = true;

    // Persist live spend into adSpendStore if valid
    if (metaInsights && !isRange && targetDateStr) {
      adSpendStore.setSpend(targetDateStr, {
        baseSpend: metaInsights.baseSpend,
        spendWithGST: metaInsights.spendWithGST,
        impressions: metaInsights.impressions,
        clicks: metaInsights.clicks,
        metaPurchases: metaInsights.purchases,
        isManual: false,
      });
    }
  } catch (err) {
    metaError = err.message;
    console.warn(`[LiveROAS] Meta API fetch failed: ${err.message}. Using stored/fallback spend.`);
  }

  // Determine Meta spend values (either from live API or persistent spend store)
  let baseSpend = 0;
  let gstAmount = 0;
  let spendWithGST = 0;
  let impressions = 0;
  let clicks = 0;
  let reach = 0;
  let cpc = 0;
  let cpm = 0;
  let ctr = 0;
  let purchases = 0;
  let metaRoas = 0;
  let isManualSpend = false;

  if (metaInsights && isLiveMeta) {
    baseSpend = metaInsights.baseSpend || 0;
    gstAmount = metaInsights.gstAmount || 0;
    spendWithGST = metaInsights.spendWithGST || 0;
    impressions = metaInsights.impressions || 0;
    clicks = metaInsights.clicks || 0;
    reach = metaInsights.reach || 0;
    cpc = metaInsights.cpc || 0;
    cpm = metaInsights.cpm || 0;
    ctr = metaInsights.ctr || 0;
    purchases = metaInsights.purchases || 0;
    metaRoas = metaInsights.metaRoas || 0;
  } else {
    // Check fallback store
    const stored = adSpendStore.getSpend(targetDateStr);
    if (stored) {
      baseSpend = stored.baseSpend || 0;
      gstAmount = stored.gstAmount || 0;
      spendWithGST = stored.spendWithGST || 0;
      impressions = stored.impressions || 0;
      clicks = stored.clicks || 0;
      purchases = stored.metaPurchases || 0;
      isManualSpend = stored.isManual || false;
    }
  }

  // 2. Fetch Shopify Orders for the given date/range
  const orders = await shopifyManager.fetchAllOrders({
    created_at_min: createdAtMin,
    ...(createdAtMax ? { created_at_max: createdAtMax } : {}),
    limit: 250,
  });

  // Filter for exact date matching if single day
  const filteredOrders = !isRange
    ? orders.filter((o) => {
        const orderDateIST = new Date(o.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        return orderDateIST === targetDateStr;
      })
    : orders;

  let totalSales = 0;
  let codOrders = 0;
  let codSales = 0;
  let prepaidOrders = 0;
  let prepaidSales = 0;
  let cancelledOrders = 0;
  const activeOrdersList = [];

  for (const o of filteredOrders) {
    if (o.cancelled_at) {
      cancelledOrders++;
      continue;
    }

    activeOrdersList.push(o);
    totalSales += o.total_price;

    if (o.is_cod) {
      codOrders++;
      codSales += o.total_price;
    } else {
      prepaidOrders++;
      prepaidSales += o.total_price;
    }
  }

  const validOrdersCount = activeOrdersList.length;

  // Key Calculated Metrics
  const grossRoas = spendWithGST > 0 ? (totalSales / spendWithGST).toFixed(2) : '0.00';
  const cpo = validOrdersCount > 0 && spendWithGST > 0 ? (spendWithGST / validOrdersCount).toFixed(2) : '0.00';
  const aov = validOrdersCount > 0 ? (totalSales / validOrdersCount).toFixed(2) : '0.00';

  return {
    datePreset,
    dateIST: targetDateStr,
    isRange,
    meta: {
      accountName: 'Mahekh',
      currency: 'INR',
      baseSpend: Math.round(baseSpend * 100) / 100,
      gstRate: '18%',
      gstAmount: Math.round(gstAmount * 100) / 100,
      spendWithGST: Math.round(spendWithGST * 100) / 100,
      impressions,
      clicks,
      reach,
      cpc,
      cpm,
      ctr,
      metaReportedPurchases: purchases,
      metaReportedRoas: metaRoas,
      isLive: isLiveMeta,
      isManual: isManualSpend,
      status: isLiveMeta ? 'connected' : (metaError ? 'error' : 'manual'),
      errorMessage: metaError,
    },
    shopify: {
      status: 'connected',
      totalOrders: validOrdersCount,
      cancelledOrders,
      totalSales: Math.round(totalSales * 100) / 100,
      codOrders,
      codSales: Math.round(codSales * 100) / 100,
      prepaidOrders,
      prepaidSales: Math.round(prepaidSales * 100) / 100,
      aov: parseFloat(aov),
      orders: filteredOrders.map((o) => ({
        id: o.id,
        name: o.name,
        created_at: o.created_at,
        customerName: o.customer.name,
        city: o.shipping_address.city,
        province: o.shipping_address.province,
        total_price: o.total_price,
        payment_mode: o.payment_mode,
        is_cancelled: Boolean(o.cancelled_at),
        fulfillment_status: o.fulfillment_status,
        financial_status: o.financial_status,
        line_items: o.line_items.map((i) => `${i.title} (${i.quantity})`).join(', '),
      })),
    },
    blended: {
      grossRoas: parseFloat(grossRoas),
      costPerOrder: parseFloat(cpo),
      netMarginEstimator: {
        totalSales,
        totalAdSpendWithGST: spendWithGST,
      },
    },
  };
}

// If run directly from CLI
if (process.argv[1]?.endsWith('live-roas.js')) {
  try {
    const preset = process.argv[2] || 'today';
    console.log(`Fetching live performance metrics for [${preset}]...`);
    const data = await getLiveMetrics(preset);

    console.log('\n======================================================');
    console.log(`  MAHEKH LIVE ROAS & EXPENSE REPORT (${data.dateIST})`);
    console.log('======================================================');
    console.log(` Meta Status:            ${data.meta.isLive ? '🟢 LIVE API' : '🟡 STORED/MANUAL SPEND'}`);
    if (data.meta.errorMessage) console.log(` (Note: ${data.meta.errorMessage})`);
    console.log(` Meta Base Spend:        ₹${data.meta.baseSpend.toLocaleString('en-IN')}`);
    console.log(` + 18% GST on Ads:       ₹${data.meta.gstAmount.toLocaleString('en-IN')}`);
    console.log(` TOTAL AD SPEND (w/ GST):₹${data.meta.spendWithGST.toLocaleString('en-IN')}`);
    console.log('------------------------------------------------------');
    console.log(` Shopify Status:         🟢 CONNECTED`);
    console.log(` Shopify Orders Count:   ${data.shopify.totalOrders} orders (COD: ${data.shopify.codOrders}, Prepaid: ${data.shopify.prepaidOrders})`);
    if (data.shopify.cancelledOrders > 0) console.log(` Cancelled Orders:       ${data.shopify.cancelledOrders}`);
    console.log(` Total Shopify Revenue:  ₹${data.shopify.totalSales.toLocaleString('en-IN')}`);
    console.log(` Average Order Value:    ₹${data.shopify.aov}`);
    console.log('------------------------------------------------------');
    console.log(` REAL BLENDED ROAS:      ${data.blended.grossRoas}x`);
    console.log(` Cost Per Order (CPO):   ₹${data.blended.costPerOrder}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error fetching live metrics:', err);
  }
}
