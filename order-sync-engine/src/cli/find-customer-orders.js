import fs from 'node:fs';
import path from 'node:path';
import { ShiprocketClient } from '../shiprocket/client.js';
import { config } from '../config.js';

async function scanAllOrdersForCustomer(searchPhone = '9565179040') {
  console.log(`\n🔍 Scanning 1-Year Shiprocket Archive for Customer Phone: ${searchPhone}...`);
  const client = new ShiprocketClient();

  // Get total pages
  const initRes = await client.request('/orders?from=2025-09-12&to=2026-09-11&per_page=100&page=1');
  const totalOrders = initRes.meta?.pagination?.total || 7028;
  const totalPages = Math.ceil(totalOrders / 100);
  console.log(`Total Orders in 1-Year Range: ${totalOrders} across ${totalPages} pages.`);

  const matched = [];

  function checkOrder(o) {
    const p1 = String(o.customer_phone || '');
    const p2 = String(o.customer_alternate_phone || '');
    const p3 = String(o.others?.billing_phone || '');
    const name = String(o.customer_name || '').toLowerCase();
    const email = String(o.customer_email || '').toLowerCase();

    if (
      p1.includes(searchPhone) ||
      p2.includes(searchPhone) ||
      p3.includes(searchPhone) ||
      name.includes('ratnakar') ||
      email.includes('ratnakar') ||
      email.includes('thisisfordemoonly')
    ) {
      matched.push({
        order_id: o.id,
        channel_order_id: o.channel_order_id,
        order_name: o.others?.name || o.channel_order_id || `#${o.id}`,
        channel_name: o.channel_name || 'Shopify/Custom',
        date: o.created_at || o.channel_created_at,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        city: o.customer_city,
        state: o.customer_state,
        pincode: o.customer_pincode,
        payment_method: o.payment_method,
        total: parseFloat(o.total || '0'),
        status: o.status,
        awb: o.shipments?.[0]?.awb || o.awb_code || 'Not Assigned',
        courier: o.shipments?.[0]?.courier || o.courier_name || 'N/A',
        items: (o.products || []).map((pr) => `${pr.name} (x${pr.quantity})`).join(', ') || 'Attar Product',
      });
    }
  }

  // Check page 1
  for (const o of initRes.data || []) {
    checkOrder(o);
  }

  // Concurrent batches of 6 pages
  const concurrency = 6;
  const pageList = [];
  for (let p = 2; p <= totalPages; p++) {
    pageList.push(p);
  }

  for (let i = 0; i < pageList.length; i += concurrency) {
    const batch = pageList.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (p) => {
        try {
          const res = await client.request(`/orders?from=2025-09-12&to=2026-09-11&per_page=100&page=${p}`);
          for (const o of res.data || []) {
            checkOrder(o);
          }
        } catch (e) {
          console.warn(`Page ${p} fetch warning: ${e.message}`);
        }
      })
    );
    process.stdout.write(`\rScanned pages ${Math.min(i + concurrency + 1, totalPages)}/${totalPages}... Found ${matched.length} orders`);
  }

  console.log(`\n\n🎯 Scan Complete! Found ${matched.length} matching order(s) for ${searchPhone}.\n`);

  // Sort by date desc
  matched.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Save to JSON & CSV
  const outPath = path.join(config.exportsDir, `customer-history-${searchPhone}.json`);
  fs.writeFileSync(outPath, JSON.stringify(matched, null, 2), 'utf8');

  function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }
  const headers = ['Order #', 'Date', 'Customer Name', 'Phone', 'City', 'Pincode', 'Status', 'Courier', 'AWB Code', 'Amount (INR)', 'Payment Mode', 'Items'];
  const csvRows = matched.map((o) => [
    escapeCSV(o.order_name),
    escapeCSV(o.date),
    escapeCSV(o.customer_name),
    escapeCSV(o.customer_phone),
    escapeCSV(o.city),
    escapeCSV(o.pincode),
    escapeCSV(o.status),
    escapeCSV(o.courier),
    escapeCSV(o.awb),
    escapeCSV(o.total),
    escapeCSV(o.payment_method),
    escapeCSV(o.items),
  ]);
  const csvPath = path.join(config.exportsDir, `customer-history-${searchPhone}.csv`);
  fs.writeFileSync(csvPath, [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n'), 'utf8');

  // Print Summary
  const statusCounts = {};
  matched.forEach((m) => {
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
  });

  console.log('='.repeat(65));
  console.log(` 📦 LIFETIME ORDER STATUS BREAKDOWN FOR ${searchPhone}`);
  console.log('='.repeat(65));
  for (const [st, count] of Object.entries(statusCounts)) {
    console.log(`  • ${st.padEnd(25)}: ${count} Order(s)`);
  }
  console.log('='.repeat(65));

  console.log('\nDETAILED ORDER LIST:');
  console.table(
    matched.map((m) => ({
      'Order #': m.order_name,
      Date: m.date?.slice(0, 11) || '',
      Status: m.status,
      Courier: m.courier,
      AWB: m.awb,
      Amount: `₹${m.total}`,
      Payment: m.payment_method,
    }))
  );
}

scanAllOrdersForCustomer(process.argv[2] || '9565179040').catch(console.error);
