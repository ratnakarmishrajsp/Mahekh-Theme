import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

// Native .env parser
const envPath = path.join(ROOT_DIR, 'order-sync-engine', '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      envVars[k] = v;
    }
  });
}

const API_KEY = envVars.AISENSY_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYWJlYTI1ZWM2MjBmZjBhNGU1OTM3NCIsIm5hbWUiOiJNYWhla2ggRnJlZ3JhbmNlcyIsImFwcE5hbWUiOiJBaVNlbnN5IiwiY2xpZW50SWQiOiI2YWFiZWEyNWVjNjIwZmYwYTRlNTkzNmUiLCJhY3RpdmVQbGFuIjoiUFJPX01PTlRITFkiLCJpYXQiOjE3ODk4MDIwODl9.L4efQ9DjtXiNaDrylopSvQ9s0gTI918W9Uz9DbwwMzY';
const CAMPAIGN_NAME = envVars.AISENSY_CAMPAIGN_NAME || 'NEW 2300';
const MEDIA_URL = envVars.AISENSY_MEDIA_URL || 'https://crm.ratnakarmishra.in/mahekh_special_sale.jpg';
const CSV_PATH = path.join(ROOT_DIR, 'whatsapp-campaign-data', '1-DELIVERED', '02-remaining-delivered-all-2312.csv');
const EXCLUDE_PATH = path.join(ROOT_DIR, 'whatsapp-campaign-data', '1-DELIVERED', '01-morning-test-1000.csv');
const REPORT_PATH = path.join(ROOT_DIR, 'whatsapp-campaign-data', '1-DELIVERED', 'broadcast_report_new_2300.json');

async function sendWhatsApp(customer) {
  const payload = {
    apiKey: API_KEY,
    campaignName: CAMPAIGN_NAME,
    destination: customer.phone.startsWith('91') ? customer.phone : '91' + customer.phone,
    userName: customer.name,
    media: {
      url: MEDIA_URL,
      filename: 'mahekh_special_sale.jpg'
    },
    templateParams: [customer.name, '100']
  };

  try {
    const res = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.status === 200 || data.success === 'true' || data.success === true) {
      return { success: true, messageId: data.submitted_message_id || 'OK' };
    } else {
      return { success: false, error: data.message || data.errorMessage || JSON.stringify(data) };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function run() {
  const args = process.argv.slice(2);
  const isDemo = args.includes('--demo');
  const isLive = args.includes('--live');

  console.log('====================================================');
  console.log('  MAHEKH FRAGRANCES - AISENSY 2300 BROADCAST ENGINE');
  console.log('  Campaign Name :', CAMPAIGN_NAME);
  console.log('  Media URL     :', MEDIA_URL);
  console.log('  Discount Value: ₹100');
  console.log('====================================================\n');

  if (isDemo) {
    console.log('Running 1 Demo Test Message to Ratnakar (9565179040)...');
    const res = await sendWhatsApp({ name: 'Ratnakar Mishra', phone: '919565179040' });
    console.log('Demo result:', res);
    return;
  }

  if (!isLive) {
    console.log('ℹ️ Safety guard: Pass --live flag to start broadcast to all customers.');
    console.log('Example: node order-sync-engine/src/cli/broadcast-2300-delivered.js --live\n');
    return;
  }

  // Load excluded phones
  const excludeSet = new Set();
  if (fs.existsSync(EXCLUDE_PATH)) {
    const exLines = fs.readFileSync(EXCLUDE_PATH, 'utf8').split('\n').filter(Boolean).slice(1);
    exLines.forEach(l => {
      const ph = l.split(',')[1]?.trim().replace(/[^0-9]/g, '');
      if (ph) excludeSet.add(ph.slice(-10));
    });
  }
  console.log(`Loaded ${excludeSet.size} previously messaged numbers to exclude.`);

  // Load target customers
  if (!fs.existsSync(CSV_PATH)) {
    console.error('Target CSV not found:', CSV_PATH);
    process.exit(1);
  }

  const rawLines = fs.readFileSync(CSV_PATH, 'utf8').split('\n').filter(Boolean).slice(1);
  const queue = [];
  const seenInBatch = new Set();

  for (const line of rawLines) {
    const parts = line.split(',');
    if (parts.length < 2) continue;
    let name = parts[0].replace(/\"/g, '').trim();
    let phone = parts[1].replace(/[^0-9]/g, '').trim();

    const tenDigit = phone.slice(-10);
    if (excludeSet.has(tenDigit)) continue;
    if (seenInBatch.has(tenDigit)) continue;
    seenInBatch.add(tenDigit);

    queue.push({ name, phone });
  }

  console.log(`Total verified recipients to broadcast: ${queue.length}\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  const CONCURRENCY = 6;
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const chunk = queue.slice(i, i + CONCURRENCY);
    const promises = chunk.map(async (cust, idx) => {
      const currentIdx = i + idx + 1;
      const res = await sendWhatsApp(cust);
      if (res.success) {
        successCount++;
        results.push({ phone: cust.phone, name: cust.name, status: 'SENT', id: res.messageId });
      } else {
        failCount++;
        results.push({ phone: cust.phone, name: cust.name, status: 'FAILED', error: res.error });
      }

      if (currentIdx % 50 === 0 || currentIdx === queue.length) {
        const pct = ((currentIdx / queue.length) * 100).toFixed(1);
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`[${currentIdx}/${queue.length}] (${pct}%) | Success: ${successCount} | Failed: ${failCount} | Elapsed: ${elapsedSec}s`);
      }
    });

    await Promise.all(promises);
    // 250ms polite throttle
    await new Promise(r => setTimeout(r, 250));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const report = {
    campaign: CAMPAIGN_NAME,
    media: MEDIA_URL,
    total: queue.length,
    success: successCount,
    failed: failCount,
    duration_seconds: duration,
    completed_at: new Date().toISOString(),
    results
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log('\n====================================================');
  console.log('  BROADCAST COMPLETED');
  console.log(`  Total Processed: ${queue.length}`);
  console.log(`  Successful     : ${successCount}`);
  console.log(`  Failed         : ${failCount}`);
  console.log(`  Total Duration : ${duration} seconds`);
  console.log(`  Report Saved   : ${REPORT_PATH}`);
  console.log('====================================================');
}

run().catch(console.error);
