import fs from 'node:fs';
import path from 'node:path';
import { ShiprocketTrackingManager } from '../shiprocket/tracking.js';
import { config } from '../config.js';

async function exportLast30Days() {
  console.log('Fetching last 30 days data from Shiprocket...');
  const mgr = new ShiprocketTrackingManager();
  const orders = await mgr.fetchAllShiprocketOrders(10);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const filtered = orders.filter((o) => {
    const d = new Date(o.created_at);
    return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
  });

  function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  const headers = [
    'Order #',
    'Channel Order ID',
    'Created At',
    'Customer Name',
    'Customer Phone',
    'City',
    'State',
    'Pincode',
    'Payment Method',
    'Order Value (INR)',
    'AWB Code',
    'Courier Partner',
    'Current Status',
  ];

  const rows = filtered.map((o) => [
    escapeCSV(o.raw?.others?.name || o.channel_order_id),
    escapeCSV(o.channel_order_id),
    escapeCSV(o.created_at),
    escapeCSV(o.customer_name),
    escapeCSV(o.customer_phone),
    escapeCSV(o.customer_city),
    escapeCSV(o.customer_state),
    escapeCSV(o.customer_pincode),
    escapeCSV(o.payment_method),
    escapeCSV(o.total),
    escapeCSV(o.awb_code),
    escapeCSV(o.courier_name),
    escapeCSV(o.status),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const targetFile = path.join(config.exportsDir, 'shiprocket-last-30-days.csv');
  fs.writeFileSync(targetFile, csvContent, 'utf8');

  console.log(`\n✅ Generated CSV: ${targetFile}`);
  console.log(`Total Orders in Last 30 Days: ${filtered.length}`);
}

exportLast30Days().catch(console.error);
