import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { ShiprocketTrackingManager } from '../shiprocket/tracking.js';

const cacheFile = path.join(config.dataDir, 'unified_sync.json');

function printOrderCard(order, liveTracking = null) {
  const line = '='.repeat(60);
  console.log('\n' + line);
  console.log(` ORDER DETAILS: ${order.order_name} (#${order.order_number})`);
  console.log(line);
  console.log(` Customer Name   : ${order.customer_name}`);
  console.log(` Phone Number    : ${order.customer_phone}`);
  console.log(` Destination     : ${order.customer_city || 'N/A'} (PIN: ${order.customer_pincode || 'N/A'})`);
  console.log(` Payment Method  : ${order.payment_mode} (Total: ₹${order.total_price})`);
  console.log(` Items Ordered   : ${order.items}`);
  console.log(` Created At      : ${order.created_at}`);

  console.log('-'.repeat(60));
  console.log(` LOGISTICS & FULFILLMENT STATUS:`);
  console.log(` Operational State: [ ${order.unified_status} ]`);
  console.log(` AWB Code         : ${order.awb}`);
  console.log(` Courier Partner  : ${order.courier_name}`);
  console.log(` Shiprocket Status: ${order.shiprocket_status}`);

  if (order.ndr) {
    console.log(`\n  ⚠️  NDR / DELIVERY EXCEPTION DETECTED:`);
    console.log(`   - Attempts Made : ${order.ndr.attempts}`);
    console.log(`   - Last Reason   : ${order.ndr.reason}`);
    console.log(`   - Action Needed : Please call customer immediately to verify address/slot!`);
  }

  if (liveTracking && liveTracking.activity_history?.length > 0) {
    console.log('-'.repeat(60));
    console.log(` LIVE TRACKING TIMELINE (Last 4 Scans):`);
    const recent = liveTracking.activity_history.slice(0, 4);
    for (const act of recent) {
      console.log(`  • [${act.date || 'Recent'}] ${act.activity || act.status} (${act.location || 'Hub'})`);
    }
    if (liveTracking.expected_delivery) {
      console.log(`  • Expected Delivery Date: ${liveTracking.expected_delivery}`);
    }
  }
  console.log(line + '\n');
}

async function runInspect() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Usage:
  node src/cli/inspect.js <phone | order_number | awb>
  node src/cli/inspect.js --phone 9876543210
  node src/cli/inspect.js --order 1001
  node src/cli/inspect.js --awb 141123456789
`);
    process.exit(0);
  }

  let query = '';
  let mode = 'auto';

  if (args[0] === '--phone') {
    mode = 'phone';
    query = args[1];
  } else if (args[0] === '--order') {
    mode = 'order';
    query = args[1];
  } else if (args[0] === '--awb') {
    mode = 'awb';
    query = args[1];
  } else {
    query = args[0];
  }

  if (!query) {
    console.error('Error: Please provide a search query.');
    process.exit(1);
  }

  // Load cached synced data
  if (!fs.existsSync(cacheFile)) {
    console.log('No local synced database found. Running live lookup or run `npm run sync` first.');
  }

  let unifiedData = [];
  if (fs.existsSync(cacheFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      unifiedData = parsed.orders || [];
    } catch {
      unifiedData = [];
    }
  }

  const cleanQuery = query.replace(/^#/, '').trim();
  const digitsOnly = query.replace(/[^0-9]/g, '');

  const matches = unifiedData.filter((o) => {
    if (mode === 'order' || (mode === 'auto' && cleanQuery.length <= 6)) {
      if (String(o.order_number) === cleanQuery || o.order_name.replace(/^#/, '') === cleanQuery) {
        return true;
      }
    }
    if (mode === 'phone' || (mode === 'auto' && digitsOnly.length >= 10)) {
      const phoneDigits = (o.customer_phone || '').replace(/[^0-9]/g, '');
      if (phoneDigits.endsWith(digitsOnly.slice(-10))) {
        return true;
      }
    }
    if (mode === 'awb' || mode === 'auto') {
      if (String(o.awb).toLowerCase() === cleanQuery.toLowerCase()) {
        return true;
      }
    }
    return false;
  });

  if (matches.length === 0) {
    console.log(`\n❌ No matching order found for "${query}" in local synced database.`);
    console.log('Tip: Make sure you ran `npm run sync` recently with your live API credentials.\n');
    return;
  }

  console.log(`\n🔍 Found ${matches.length} matching order(s) for "${query}":`);

  const srTracking = new ShiprocketTrackingManager();

  for (const order of matches) {
    let liveTracking = null;
    if (order.awb && order.awb !== 'NOT_ASSIGNED') {
      try {
        liveTracking = await srTracking.trackByAwb(order.awb);
      } catch {
        // Fallback to cached status
      }
    }
    printOrderCard(order, liveTracking);
  }
}

runInspect().catch(console.error);
