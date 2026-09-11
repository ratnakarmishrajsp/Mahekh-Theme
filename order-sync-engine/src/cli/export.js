import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportToCSV(orders, filename = null) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetFile = filename || path.join(config.exportsDir, `orders-audit-${timestamp}.csv`);

  const headers = [
    'Order #',
    'Shopify Order ID',
    'Created At',
    'Customer Name',
    'Customer Phone',
    'City',
    'Pincode',
    'Payment Mode',
    'Total Amount (INR)',
    'Items',
    'AWB Code',
    'Courier Partner',
    'Shiprocket Status',
    'Unified Status',
    'Is NDR?',
    'NDR Attempts',
    'NDR Reason',
  ];

  const rows = orders.map((o) => [
    escapeCSV(o.order_name),
    escapeCSV(o.shopify_order_id),
    escapeCSV(o.created_at),
    escapeCSV(o.customer_name),
    escapeCSV(o.customer_phone),
    escapeCSV(o.customer_city),
    escapeCSV(o.customer_pincode),
    escapeCSV(o.payment_mode),
    escapeCSV(o.total_price),
    escapeCSV(o.items),
    escapeCSV(o.awb),
    escapeCSV(o.courier_name),
    escapeCSV(o.shiprocket_status),
    escapeCSV(o.unified_status),
    escapeCSV(o.ndr ? 'YES' : 'NO'),
    escapeCSV(o.ndr?.attempts || 0),
    escapeCSV(o.ndr?.reason || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  fs.writeFileSync(targetFile, csvContent, 'utf8');

  console.log(`[Export] Successfully generated CSV audit report: ${targetFile}`);
  return targetFile;
}

export function exportToJSON(data, filename = null) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetFile = filename || path.join(config.exportsDir, `orders-intelligence-${timestamp}.json`);
  fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[Export] Successfully generated JSON audit report: ${targetFile}`);
  return targetFile;
}

async function runExporter() {
  const cacheFile = path.join(config.dataDir, 'unified_sync.json');
  if (!fs.existsSync(cacheFile)) {
    console.error('No sync data found. Please run `npm run sync` first.');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const orders = payload.orders || [];

  console.log(`Exporting ${orders.length} orders...`);
  exportToCSV(orders);
  exportToJSON(payload);
}

if (process.argv[1] && process.argv[1].endsWith('export.js')) {
  runExporter().catch(console.error);
}
