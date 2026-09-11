import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const jsonPath = path.join(config.exportsDir, 'customer-history-9565179040.json');
const csvPath = path.join(config.exportsDir, 'customer-history-9565179040.csv');

if (fs.existsSync(jsonPath)) {
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  function esc(val) {
    if (val === null || val === undefined) return '""';
    return '"' + String(val).replace(/"/g, '""') + '"';
  }

  const headers = ['Order #', 'Date', 'Customer Name', 'Phone', 'City', 'Pincode', 'Status', 'Courier', 'AWB Code', 'Amount (INR)', 'Payment Mode', 'Items'];
  const rows = json.map((o) => [
    esc(o.order_name),
    esc(o.date),
    esc(o.customer_name),
    esc(o.customer_phone),
    esc(o.city),
    esc(o.pincode),
    esc(o.status),
    esc(o.courier),
    esc(o.awb),
    esc(o.total),
    esc(o.payment_method),
    esc(o.items),
  ]);

  fs.writeFileSync(csvPath, [headers.join(','), ...rows.map((r) => r.join(','))].join('\n'), 'utf8');
  console.log('CSV Export Created at:', csvPath);
}
