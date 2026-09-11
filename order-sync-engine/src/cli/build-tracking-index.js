import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const workspaceRoot = 'c:\\Users\\Ratnakar\\Desktop\\Mahekh theme';
const syncFile = path.join(config.dataDir, 'unified_sync.json');

function mapStatusToStage(status) {
  const s = String(status || '').toUpperCase();
  if (s.includes('DELIVERED') && !s.includes('RTO')) return 5;
  if (s.includes('OUT FOR DELIVERY') || s.includes('OFD')) return 4;
  if (s.includes('IN TRANSIT') || s.includes('PICKED UP') || s.includes('SHIPPED')) return 3;
  if (s.includes('PICKUP SCHEDULED') || s.includes('MANIFESTED') || s.includes('BOOKED')) return 2;
  return 1;
}

export function generateCompactTrackingIndex() {
  if (!fs.existsSync(syncFile)) {
    throw new Error(`Sync file not found at ${syncFile}`);
  }

  const syncData = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
  const rawOrders = syncData.orders || [];

  const compactList = rawOrders.map(o => {
    const rawNum = String(o.order_number || '');
    const cleanName = String(o.order_name || '').replace('#', '').trim();
    const awb = o.awb && o.awb !== 'NOT_ASSIGNED' ? o.awb : null;
    const phone = o.customer_phone ? String(o.customer_phone).replace(/\D/g, '').slice(-10) : '';
    const stage = awb ? mapStatusToStage(o.shiprocket_status) : 1;

    let displayStatus = 'Order Confirmed & In Process';
    if (awb && o.shiprocket_status && o.shiprocket_status !== 'NOT_SYNCED') {
      displayStatus = o.shiprocket_status;
    }

    return {
      name: o.order_name,
      num: rawNum,
      cleanName: cleanName.toLowerCase(),
      awb: awb,
      courier: o.courier_name && o.courier_name !== 'N/A' ? o.courier_name : (awb ? 'Shiprocket Express' : 'Pending Allocation'),
      status: displayStatus,
      stage: stage,
      city: o.customer_city || 'India',
      phone: phone,
      date: o.created_at ? o.created_at.split('T')[0] : 'Recent',
      track_url: awb ? `https://shiprocket.co/tracking/${awb}` : null,
    };
  });

  const outputAssetPath = path.join(workspaceRoot, 'assets', 'mahekh-tracking-index.json');
  fs.writeFileSync(outputAssetPath, JSON.stringify(compactList));
  const stats = fs.statSync(outputAssetPath);

  console.log(`✔ Generated compact tracking index with ${compactList.length} orders at ${outputAssetPath}`);
  console.log(`  File size: ${(stats.size / 1024).toFixed(1)} KB\n`);
  return outputAssetPath;
}

generateCompactTrackingIndex();
