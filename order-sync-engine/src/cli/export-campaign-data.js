import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root paths
const ROOT_DIR = path.resolve(__dirname, '../../..');
const DATA_FILE = path.resolve(ROOT_DIR, 'order-sync-engine/data/unified_sync.json');
const EXPORT_DIR = path.resolve(ROOT_DIR, 'whatsapp-campaign-data');

// Ensure output directories exist
const DELIVERED_DIR = path.join(EXPORT_DIR, '1-DELIVERED');
const RTO_DIR = path.join(EXPORT_DIR, '2-RTO');
const UNSHIPPED_DIR = path.join(EXPORT_DIR, '3-UNSHIPPED-PENDING');

[EXPORT_DIR, DELIVERED_DIR, RTO_DIR, UNSHIPPED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Load unified sync data
if (!fs.existsSync(DATA_FILE)) {
  console.error(`Error: Data file not found at ${DATA_FILE}`);
  process.exit(1);
}

const rawData = fs.readFileSync(DATA_FILE, 'utf8');
const { orders } = JSON.parse(rawData);
console.log(`Loaded ${orders.length} total orders from unified sync.`);

// Helper functions for cleaning
function cleanPhone(raw) {
  if (!raw) return null;
  let p = String(raw).replace(/[^0-9]/g, '');
  if (p.startsWith('91') && p.length === 12) {
    p = p.slice(2);
  }
  // Valid Indian mobile numbers start with 6, 7, 8, 9 and are 10 digits
  if (p.length === 10 && /^[6-9]\d{9}$/.test(p)) {
    return '91' + p;
  }
  return null;
}

function cleanName(raw) {
  if (!raw) return 'Customer';
  let n = String(raw).trim()
    .replace(/[^\w\s.-]/gi, '')
    .replace(/\s+/g, ' ');
  if (!n || n === '.' || n === '-' || n.length < 2) return 'Customer';
  // Capitalize each word properly
  return n.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function escapeCsv(str) {
  const s = String(str || '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeCsv(filePath, records) {
  const header = 'Name,Phone\n';
  const rows = records.map(r => `${escapeCsv(r.name)},${escapeCsv(r.phone)}`).join('\n');
  fs.writeFileSync(filePath, header + rows, 'utf8');
  console.log(`Saved: ${path.basename(filePath)} (${records.length} records)`);
}

// Data structures
const deliveredMap = new Map();
const rtoMap = new Map();
const unshippedMap = new Map();

// 1. Extract DELIVERED customers
orders.forEach(o => {
  const s = (o.shiprocket_status || '').trim().toUpperCase();
  const phone = cleanPhone(o.customer_phone);
  if (!phone) return;
  const name = cleanName(o.customer_name);

  if (s === 'DELIVERED') {
    if (!deliveredMap.has(phone)) {
      deliveredMap.set(phone, { name, phone });
    } else if (deliveredMap.get(phone).name === 'Customer' && name !== 'Customer') {
      deliveredMap.set(phone, { name, phone });
    }
  }
});

// 2. Extract RTO customers (Excluding anyone in DELIVERED)
orders.forEach(o => {
  const s = (o.shiprocket_status || '').trim().toUpperCase();
  const phone = cleanPhone(o.customer_phone);
  if (!phone) return;
  const name = cleanName(o.customer_name);

  if (s.startsWith('RTO')) {
    if (!deliveredMap.has(phone)) {
      if (!rtoMap.has(phone)) {
        rtoMap.set(phone, { name, phone });
      } else if (rtoMap.get(phone).name === 'Customer' && name !== 'Customer') {
        rtoMap.set(phone, { name, phone });
      }
    }
  }
});

// 3. Extract UNSHIPPED / PENDING customers (Excluding DELIVERED & RTO)
orders.forEach(o => {
  const s = (o.shiprocket_status || '').trim().toUpperCase();
  const phone = cleanPhone(o.customer_phone);
  if (!phone) return;
  const name = cleanName(o.customer_name);

  if (!deliveredMap.has(phone) && !rtoMap.has(phone)) {
    if (s === 'NEW' || s === 'CANCELED' || !s || s === 'NOT_SYNCED') {
      if (!unshippedMap.has(phone)) {
        unshippedMap.set(phone, { name, phone });
      } else if (unshippedMap.get(phone).name === 'Customer' && name !== 'Customer') {
        unshippedMap.set(phone, { name, phone });
      }
    }
  }
});

const deliveredList = Array.from(deliveredMap.values());
const rtoList = Array.from(rtoMap.values());
const unshippedList = Array.from(unshippedMap.values());

console.log('\n--- EXTRACTION SUMMARY ---');
console.log(`1. Delivered Customers: ${deliveredList.length}`);
console.log(`2. RTO Customers (Delivered Excluded): ${rtoList.length}`);
console.log(`3. Unshipped / Pending Customers (Delivered & RTO Excluded): ${unshippedList.length}`);

// Write DELIVERED batches (1000, 1000, 1000, 312 + Master)
writeCsv(path.join(DELIVERED_DIR, '01-delivered-batch-1-1000.csv'), deliveredList.slice(0, 1000));
writeCsv(path.join(DELIVERED_DIR, '02-delivered-batch-2-1000.csv'), deliveredList.slice(1000, 2000));
writeCsv(path.join(DELIVERED_DIR, '03-delivered-batch-3-1000.csv'), deliveredList.slice(2000, 3000));
writeCsv(path.join(DELIVERED_DIR, '04-delivered-batch-4-312.csv'), deliveredList.slice(3000));
writeCsv(path.join(DELIVERED_DIR, 'delivered-all-3312.csv'), deliveredList);

// Write RTO batches (1000 + remaining 359 + Master)
writeCsv(path.join(RTO_DIR, '01-rto-batch-1-1000.csv'), rtoList.slice(0, 1000));
writeCsv(path.join(RTO_DIR, '02-rto-batch-2-359.csv'), rtoList.slice(1000));
writeCsv(path.join(RTO_DIR, 'rto-all-1359.csv'), rtoList);

// Write UNSHIPPED / PENDING
writeCsv(path.join(UNSHIPPED_DIR, 'unshipped-pending-736.csv'), unshippedList);

console.log('\nAll files created successfully in:', EXPORT_DIR);
