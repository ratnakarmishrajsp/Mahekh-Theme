import { MetaAdsClient } from '../meta/client.js';
import { ShopifyClient } from '../shopify/client.js';
import { ShopifyOrderManager } from '../shopify/orders.js';

export async function getLiveMetrics(datePreset = 'today') {
  const meta = new MetaAdsClient();
  const shopifyClient = new ShopifyClient();
  const shopifyManager = new ShopifyOrderManager(shopifyClient);

  // 1. Fetch Meta Insights
  const metaInsights = await meta.getInsights(datePreset);

  // 2. Fetch Shopify Orders for the given date
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  let createdAtMin;
  let createdAtMax;
  
  if (datePreset === 'today') {
    createdAtMin = `${todayIST}T00:00:00+05:30`;
  } else if (datePreset === 'yesterday') {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = y.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    createdAtMin = `${yStr}T00:00:00+05:30`;
    createdAtMax = `${yStr}T23:59:59+05:30`;
  } else if (datePreset === 'last_7d') {
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const d7Str = d7.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    createdAtMin = `${d7Str}T00:00:00+05:30`;
  }

  const orders = await shopifyManager.fetchAllOrders({
    created_at_min: createdAtMin,
    ...(createdAtMax ? { created_at_max: createdAtMax } : {}),
    limit: 100,
  });

  // Filter for exact date matching if yesterday or today
  const targetDateStr = datePreset === 'yesterday' 
    ? new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    : todayIST;

  const filteredOrders = (datePreset === 'today' || datePreset === 'yesterday')
    ? orders.filter(o => {
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

  for (const o of filteredOrders) {
    if (o.cancelled_at) {
      cancelledOrders++;
      continue;
    }
    totalSales += o.total_price;
    if (o.is_cod) {
      codOrders++;
      codSales += o.total_price;
    } else {
      prepaidOrders++;
      prepaidSales += o.total_price;
    }
  }

  const validOrdersCount = filteredOrders.length - cancelledOrders;
  const spendWithGST = metaInsights.spendWithGST || 0;
  const baseSpend = metaInsights.baseSpend || 0;
  const gstAmount = metaInsights.gstAmount || 0;

  // Key Calculated Metrics
  const grossRoas = spendWithGST > 0 ? (totalSales / spendWithGST).toFixed(2) : '0.00';
  const cpo = validOrdersCount > 0 ? (spendWithGST / validOrdersCount).toFixed(2) : '0.00';
  const aov = validOrdersCount > 0 ? (totalSales / validOrdersCount).toFixed(2) : '0.00';

  return {
    datePreset,
    dateIST: targetDateStr,
    meta: {
      accountName: 'Mahekh',
      currency: 'INR',
      baseSpend,
      gstRate: '18%',
      gstAmount,
      spendWithGST,
      impressions: metaInsights.impressions,
      clicks: metaInsights.clicks,
      reach: metaInsights.reach,
      cpc: metaInsights.cpc,
      cpm: metaInsights.cpm,
      ctr: metaInsights.ctr,
      metaReportedPurchases: metaInsights.purchases,
      metaReportedRoas: metaInsights.metaRoas,
    },
    shopify: {
      totalOrders: validOrdersCount,
      cancelledOrders,
      totalSales: Math.round(totalSales * 100) / 100,
      codOrders,
      codSales: Math.round(codSales * 100) / 100,
      prepaidOrders,
      prepaidSales: Math.round(prepaidSales * 100) / 100,
      aov: parseFloat(aov),
      orders: filteredOrders.map(o => ({
        id: o.id,
        name: o.name,
        created_at: o.created_at,
        customerName: o.customer.name,
        city: o.shipping_address.city,
        province: o.shipping_address.province,
        total_price: o.total_price,
        payment_mode: o.payment_mode,
        fulfillment_status: o.fulfillment_status,
        financial_status: o.financial_status,
        line_items: o.line_items.map(i => `${i.title} (${i.quantity})`).join(', ')
      }))
    },
    blended: {
      grossRoas: parseFloat(grossRoas),
      costPerOrder: parseFloat(cpo),
      netMarginEstimator: {
        totalSales,
        totalAdSpendWithGST: spendWithGST,
      }
    }
  };
}

// If run directly from CLI
if (process.argv[1]?.endsWith('live-roas.js')) {
  try {
    console.log('Fetching live performance metrics...');
    const data = await getLiveMetrics('today');
    
    console.log('\n======================================================');
    console.log(`  MAHEKH LIVE ROAS & EXPENSE REPORT (${data.dateIST})`);
    console.log('======================================================');
    console.log(` Meta Base Spend:        ₹${data.meta.baseSpend.toLocaleString('en-IN')}`);
    console.log(` + 18% GST on Ads:       ₹${data.meta.gstAmount.toLocaleString('en-IN')}`);
    console.log(` TOTAL AD SPEND (w/ GST):₹${data.meta.spendWithGST.toLocaleString('en-IN')}`);
    console.log('------------------------------------------------------');
    console.log(` Shopify Orders Count:   ${data.shopify.totalOrders} orders (COD: ${data.shopify.codOrders}, Prepaid: ${data.shopify.prepaidOrders})`);
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
