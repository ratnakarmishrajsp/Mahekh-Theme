import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('order-sync-engine/data/unified_sync.json'));
const orders = raw.orders || [];

const itemCounts = new Map();
orders.forEach(o => {
  const itemStr = o.items || '';
  if (itemStr.toLowerCase().includes('kasturi')) {
    itemCounts.set(itemStr, (itemCounts.get(itemStr) || 0) + 1);
  }
});

console.log('Kasturi items in order history:');
const sorted = [...itemCounts.entries()].sort((a,b) => b[1] - a[1]);
sorted.slice(0, 20).forEach(([name, count]) => {
  console.log(`  [${count} orders] ${name}`);
});
