import fs from 'node:fs';
import path from 'node:path';
import { ShiprocketClient } from '../shiprocket/client.js';
import { config } from '../config.js';

export async function fetchAllShiprocketOrders() {
  console.log('\n🚀 Starting Full Shiprocket Archive Fetch (All Channels)...\n');
  const client = new ShiprocketClient();

  // First get total count
  const initRes = await client.request('/orders?from=2025-09-12&to=2026-09-11&per_page=100&page=1');
  const totalOrders = initRes.meta?.pagination?.total || 7029;
  const totalPages = Math.ceil(totalOrders / 100);
  console.log(`Total Orders in Archive: ${totalOrders} across ${totalPages} pages.\n`);

  const allOrders = [];

  function processOrder(o) {
    const rawPhone = String(o.customer_phone || o.customer_alternate_phone || o.others?.billing_phone || '').replace(/\D/g, '');
    const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const awb = o.shipments?.[0]?.awb || o.awb_code || (o.awb && o.awb !== 'NOT_ASSIGNED' ? o.awb : null);
    const courier = o.shipments?.[0]?.courier || o.courier_name || null;
    const items = (o.products || []).map(p => `${p.name} (x${p.quantity})`).join(', ') || 'Fragrance Product';

    return {
      shopify_order_id: String(o.id),
      order_number: o.channel_order_id ? String(o.channel_order_id).replace(/\D/g, '') : String(o.id),
      order_name: o.others?.name || o.channel_order_id || `#${o.id}`,
      created_at: o.created_at || o.channel_created_at || new Date().toISOString(),
      customer_name: o.customer_name || 'Customer',
      customer_phone: phone,
      customer_city: o.customer_city || '',
      customer_pincode: o.customer_pincode || '',
      payment_mode: String(o.payment_method || 'COD').toUpperCase(),
      total_price: parseFloat(o.total || '0'),
      items: items,
      shiprocket_order_id: o.id,
      awb: awb && awb !== 'Not Assigned' ? awb : 'NOT_ASSIGNED',
      courier_name: courier && courier !== 'N/A' ? courier : 'Shiprocket Logistics',
      shiprocket_status: String(o.status || '').toUpperCase(),
      ndr: null,
      unified_status: String(o.status || '').toUpperCase()
    };
  }

  // Page 1
  for (const o of initRes.data || []) {
    allOrders.push(processOrder(o));
  }

  // Fetch remaining pages in concurrent chunks
  const concurrency = 6;
  const pages = [];
  for (let p = 2; p <= totalPages; p++) {
    pages.push(p);
  }

  for (let i = 0; i < pages.length; i += concurrency) {
    const chunk = pages.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (p) => {
        try {
          const res = await client.request(`/orders?from=2025-09-12&to=2026-09-11&per_page=100&page=${p}`);
          for (const o of res.data || []) {
            allOrders.push(processOrder(o));
          }
        } catch (err) {
          console.warn(`[Shiprocket] Page ${p} warning: ${err.message}`);
        }
      })
    );
    process.stdout.write(`\rFetched pages up to ${Math.min(i + concurrency + 1, totalPages)}/${totalPages}... Total orders: ${allOrders.length}`);
  }

  console.log(`\n\n✔ Completed fetching ${allOrders.length} orders from Shiprocket!`);

  // Load existing unified_sync.json if exists
  const syncFile = path.join(config.dataDir, 'unified_sync.json');
  let existingOrders = [];
  if (fs.existsSync(syncFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
      existingOrders = data.orders || [];
    } catch {}
  }

  // Merge: Build a map by unique order identifier
  const mergedMap = new Map();

  // First add all existing orders
  for (const o of existingOrders) {
    const key = (o.order_name || o.order_number || o.shopify_order_id).toLowerCase().trim();
    mergedMap.set(key, o);
  }

  // Overlay / Add Shiprocket orders
  let addedCount = 0;
  for (const so of allOrders) {
    const key = so.order_name.toLowerCase().trim();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, so);
      addedCount++;
    } else {
      // Update with latest Shiprocket courier & AWB & status
      const existing = mergedMap.get(key);
      if (so.awb && so.awb !== 'NOT_ASSIGNED') existing.awb = so.awb;
      if (so.courier_name && so.courier_name !== 'Shiprocket Logistics') existing.courier_name = so.courier_name;
      if (so.shiprocket_status) existing.shiprocket_status = so.shiprocket_status;
      if (so.customer_phone && !existing.customer_phone) existing.customer_phone = so.customer_phone;
    }
  }

  const mergedList = Array.from(mergedMap.values());
  console.log(`\n✔ Merged dataset: ${mergedList.length} total orders (Added ${addedCount} historical orders from Shiprocket)\n`);

  fs.writeFileSync(syncFile, JSON.stringify({ orders: mergedList }, null, 2), 'utf8');
  console.log(`Saved unified dataset to ${syncFile}`);

  return mergedList;
}

fetchAllShiprocketOrders().catch(console.error);
