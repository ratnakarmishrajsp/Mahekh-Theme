import fs from 'node:fs';
import path from 'node:path';
import { config, validateConfig } from './config.js';
import { ShopifyOrderManager } from './shopify/orders.js';
import { ShiprocketTrackingManager } from './shiprocket/tracking.js';
import { OrderIntelligence } from './intelligence/cross-reference.js';
import { exportToCSV, exportToJSON } from './cli/export.js';

async function main() {
  console.log('='.repeat(70));
  console.log(' 🚀 SHOPIFY & SHIPROCKET ORDER INTELLIGENCE ENGINE');
  console.log('='.repeat(70));

  const validation = validateConfig();
  if (!validation.valid) {
    console.error('\n⚠️  CONFIGURATION REQUIRED:');
    console.error('The following environment variables are missing in your .env file:');
    for (const key of validation.missing) {
      console.error(`  - ${key}`);
    }
    console.log('\nPlease update your `order-sync-engine/.env` file and try again.\n');
    process.exit(1);
  }

  try {
    const startTime = Date.now();

    // 1. Shopify Orders Sync
    console.log('\n[1/3] Fetching Shopify Store Orders...');
    const shopifyManager = new ShopifyOrderManager();
    const shopifyOrders = await shopifyManager.fetchAllOrders({ status: 'any' });
    const financialMetrics = shopifyManager.calculateMetrics(shopifyOrders);

    // 2. Shiprocket Orders & NDR Sync
    console.log('\n[2/3] Fetching Shiprocket Logistics & Tracking...');
    const shiprocketManager = new ShiprocketTrackingManager();
    const shiprocketOrders = await shiprocketManager.fetchAllShiprocketOrders(10);
    const ndrList = await shiprocketManager.fetchNDRReports();
    const courierStats = shiprocketManager.calculateCourierPerformance(shiprocketOrders);

    // 3. Cross-Referencing & Intelligence
    console.log('\n[3/3] Cross-referencing & Computing Delivery / RTO Intelligence...');
    const unifiedOrders = OrderIntelligence.joinOrders(shopifyOrders, shiprocketOrders, ndrList);
    const logisticsMetrics = OrderIntelligence.calculateDeliveryAndRtoMetrics(unifiedOrders);

    // Cache sync state
    const syncPayload = {
      synced_at: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime,
      financial_metrics: financialMetrics,
      logistics_metrics: logisticsMetrics,
      courier_performance: courierStats,
      ndr_count: ndrList.length,
      orders: unifiedOrders,
    };

    const cachePath = path.join(config.dataDir, 'unified_sync.json');
    fs.writeFileSync(cachePath, JSON.stringify(syncPayload, null, 2), 'utf8');

    // Display Dashboard
    printDashboard(financialMetrics, logisticsMetrics, courierStats, ndrList.length);

    // Auto-export CSV
    const csvFile = exportToCSV(unifiedOrders);
    exportToJSON(syncPayload);

    console.log(`\n✅ Sync complete in ${((Date.now() - startTime) / 1000).toFixed(2)}s.`);
    console.log(`👉 Inspect any order with:  npm run inspect -- --phone <number>  OR  --order <#1001>`);
    console.log(`👉 CSV audit generated at: ${csvFile}\n`);
  } catch (err) {
    console.error(`\n❌ Error during sync: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }
}

function printDashboard(fin, log, couriers, ndrCount) {
  const hr = '='.repeat(70);
  console.log('\n' + hr);
  console.log(' 📊 EXECUTIVE ORDER INTELLIGENCE SUMMARY');
  console.log(hr);

  console.log('\n💰 REVENUE & ORDER BREAKDOWN (Shopify):');
  console.log(`  • Gross Revenue       : ₹${fin.gross_revenue.toLocaleString('en-IN')}`);
  console.log(`  • Total Discounts     : ₹${fin.total_discounts.toLocaleString('en-IN')}`);
  console.log(`  • Total Orders        : ${fin.total_orders} (Active: ${fin.active_orders}, Cancelled: ${fin.cancelled_orders})`);
  console.log(`  • Average Order Value : ₹${fin.average_order_value}`);
  console.log(`  • COD Orders          : ${fin.cod.count} (${fin.cod.percentage}%) - ₹${fin.cod.revenue.toLocaleString('en-IN')}`);
  console.log(`  • Prepaid Orders      : ${fin.prepaid.count} (${fin.prepaid.percentage}%) - ₹${fin.prepaid.revenue.toLocaleString('en-IN')}`);

  console.log('\n🚚 LOGISTICS & DELIVERY PERFORMANCE (Shiprocket):');
  console.log(`  • Total Shipped       : ${log.shipped_orders}`);
  console.log(`  • Successfully Delivered : ${log.delivered_orders} (Success Rate: ${log.delivery_success_rate})`);
  console.log(`  • In-Transit / OFD    : ${log.in_transit_orders + log.out_for_delivery_orders}`);
  console.log(`  • Active NDR Alert    : ${ndrCount} shipments (Requires customer callback)`);
  console.log(`  • Total RTO Returned  : ${log.rto_orders} (Overall RTO%: ${log.rto_rate})`);
  console.log(`    ↳ COD RTO Rate      : ${log.cod_performance.rto_rate} (${log.cod_performance.rto} returned / ${log.cod_performance.delivered + log.cod_performance.rto} closed)`);
  console.log(`    ↳ Prepaid RTO Rate  : ${log.prepaid_performance.rto_rate} (${log.prepaid_performance.rto} returned / ${log.prepaid_performance.delivered + log.prepaid_performance.rto} closed)`);

  if (couriers.length > 0) {
    console.log('\n📦 COURIER PARTNER BENCHMARK:');
    console.table(
      couriers.map((c) => ({
        Courier: c.name,
        Total: c.total_shipments,
        Delivered: c.delivered,
        RTO: c.rto,
        'Delivery %': c.delivery_rate,
        'RTO %': c.rto_rate,
      }))
    );
  }
  console.log(hr);
}

main();
