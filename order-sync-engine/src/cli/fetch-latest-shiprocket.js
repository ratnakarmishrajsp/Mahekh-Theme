// DISABLED PER USER INSTRUCTION
console.log('❌ Fetch Shiprocket script is completely DISABLED.');
process.exit(0);

import fs from 'node:fs';
import path from 'node:path';
import { ShiprocketClient } from '../shiprocket/client.js';
import { config } from '../config.js';

const syncFile = path.join(config.dataDir, 'unified_sync.json');

async function syncLatestShiprocketOrders() {
  console.log(`\n======================================================`);
  console.log(`Fetching Post-Sept 11 Orders from Shiprocket API`);
  console.log(`======================================================\n`);

  const client = new ShiprocketClient();
  let page = 1;
  let hasMore = true;
  const newOrders = [];

  while (hasMore) {
    console.log(`Fetching Shiprocket page ${page}...`);
    const res = await client.request(`/orders?from=2026-09-11&to=2026-10-03&per_page=100&page=${page}`);
    const ordersBatch = res.data || [];
    if (ordersBatch.length === 0) {
      hasMore = false;
      break;
    }

    for (const o of ordersBatch) {
      const rawPhone = String(o.customer_phone || o.customer_alternate_phone || o.others?.billing_phone || '').replace(/\D/g, '');
      const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
      const awb = o.shipments?.[0]?.awb || o.awb_code || (o.awb && o.awb !== 'NOT_ASSIGNED' ? o.awb : null);
      const courier = o.shipments?.[0]?.courier || o.courier_name || null;
      const items = (o.products || []).map(p => `${p.name} (x${p.quantity})`).join(', ') || 'Fragrance Product';

      newOrders.push({
        shopify_order_id: String(o.id),
        order_number: o.channel_order_id ? String(o.channel_order_id).replace(/\D/g, '') : String(o.id),
        order_name: o.others?.name || o.channel_order_id || `#${o.id}`,
        created_at: o.created_at || o.channel_created_at || new Date().toISOString(),
        customer_name: o.customer_name || 'Customer',
        customer_phone: phone,
        customer_address: o.customer_address || o.customer_address_2 || '',
        customer_city: o.customer_city || '',
        customer_state: o.customer_state || '',
        customer_pincode: o.customer_pincode || '',
        payment_mode: String(o.payment_method || 'COD').toUpperCase(),
        total_price: parseFloat(o.total || '0'),
        items: items,
        shiprocket_order_id: o.id,
        awb: awb && awb !== 'Not Assigned' ? awb : 'NOT_ASSIGNED',
        courier_name: courier && courier !== 'N/A' ? courier : 'Shiprocket Logistics',
        shiprocket_status: String(o.status || '').toUpperCase(),
        ndr: null,
        unified_status: String(o.status || '').toUpperCase(),
      });
    }

    if (ordersBatch.length < 100) {
      hasMore = false;
    } else {
      page++;
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log(`\nFetched ${newOrders.length} post-Sept 11 orders from Shiprocket.\n`);

  // Merge with existing unified_sync.json
  let existingData = { orders: [] };
  if (fs.existsSync(syncFile)) {
    existingData = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
  }

  const existingMap = new Map();
  for (const o of existingData.orders) {
    const key = o.shiprocket_order_id || o.order_number || o.shopify_order_id;
    if (key) existingMap.set(String(key), o);
  }

  let addedCount = 0;
  for (const o of newOrders) {
    const key = o.shiprocket_order_id || o.order_number || o.shopify_order_id;
    if (!existingMap.has(String(key))) {
      existingData.orders.unshift(o); // Add newest orders to the top
      existingMap.set(String(key), o);
      addedCount++;
    }
  }

  fs.writeFileSync(syncFile, JSON.stringify(existingData, null, 2), 'utf8');
  console.log(`✅ Merged into unified_sync.json: Total Orders in Database = ${existingData.orders.length} (Added ${addedCount} new orders)`);
  return { newOrders, totalOrders: existingData.orders.length };
}

syncLatestShiprocketOrders().catch(console.error);
