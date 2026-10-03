import fs from 'node:fs';
import path from 'node:path';
import { ShopifyClient } from '../shopify/client.js';
import { config } from '../config.js';

const syncFile = path.join(config.dataDir, 'unified_sync.json');

async function restoreOrdersToShopify() {
  console.log(`\n======================================================`);
  console.log(`Restoring Recent Orders (Sept 11 - Oct 3) to Shopify`);
  console.log(`Store: ${config.shopify.storeUrl}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(syncFile)) {
    throw new Error(`Sync file not found: ${syncFile}`);
  }

  const syncData = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
  const allOrders = syncData.orders || [];

  // Filter orders from September 11 onwards (or take latest 276 orders)
  const cutoff = new Date('2026-09-11T00:00:00Z');
  const recentOrders = allOrders.filter(o => {
    const d = new Date(o.created_at);
    return !isNaN(d.getTime()) && d >= cutoff;
  });

  console.log(`Found ${recentOrders.length} recent orders to push to Shopify admin.\n`);

  const shopify = new ShopifyClient();

  // Fetch existing orders to avoid duplicates
  let existing = [];
  try {
    existing = await shopify.paginate('/orders.json?status=any', 'orders', { limit: '250' });
    console.log(`Found ${existing.length} existing orders already in target store.`);
  } catch (e) {
    console.warn(`Could not list orders: ${e.message}`);
  }

  const existingNames = new Set(existing.map(o => o.name));

  let createdCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recentOrders.length; i++) {
    const o = recentOrders[i];
    const orderName = o.order_name || `#${o.order_number}`;

    if (existingNames.has(orderName)) {
      skippedCount++;
      continue;
    }

    const nameParts = (o.customer_name || 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';
    const phone = o.customer_phone ? (o.customer_phone.startsWith('+91') ? o.customer_phone : `+91${o.customer_phone}`) : undefined;

    const price = o.total_price ? String(o.total_price) : '999.00';
    const itemName = o.items || 'Mahekh Fragrance Attar';

    const dateObj = new Date(o.created_at);
    const cleanCreatedAt = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : new Date().toISOString();

    const orderPayload = {
      name: orderName,
      created_at: cleanCreatedAt,
      financial_status: o.payment_mode === 'COD' ? 'pending' : 'paid',
      send_receipt: false,
      send_fulfillment_receipt: false,
      line_items: [
        {
          title: itemName,
          price: price,
          quantity: 1,
          requires_shipping: true
        }
      ],
      customer: {
        first_name: firstName,
        last_name: lastName,
        phone: phone
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        address1: o.customer_address || o.customer_city || 'India',
        city: o.customer_city || 'City',
        province: o.customer_state || undefined,
        zip: o.customer_pincode || undefined,
        country: 'India',
        phone: phone
      },
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address1: o.customer_address || o.customer_city || 'India',
        city: o.customer_city || 'City',
        province: o.customer_state || undefined,
        zip: o.customer_pincode || undefined,
        country: 'India',
        phone: phone
      },
      tags: `Shiprocket_Restored, ${o.payment_mode || 'COD'}, ${o.unified_status || 'CONFIRMED'}`
    };

    console.log(`[${i + 1}/${recentOrders.length}] Creating order ${orderName} (${o.customer_name} - ₹${price})...`);

    try {
      const res = await shopify.request('/orders.json', {
        method: 'POST',
        body: JSON.stringify({ order: orderPayload })
      });
      createdCount++;
      existingNames.add(orderName);
      console.log(`   ✔ Restored successfully! ID: ${res.data.order.id}\n`);
    } catch (err) {
      failedCount++;
      console.error(`   ✖ Failed: ${err.message}\n`);
    }

    // Rate-limiting delay: 600ms per order to stay strictly within Shopify's 2 req/s limit
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n================ ORDERS RESTORE SUMMARY ================`);
  console.log(`Total Recent Orders: ${recentOrders.length}`);
  console.log(`Created: ${createdCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`========================================================\n`);
}

restoreOrdersToShopify().catch(console.error);
