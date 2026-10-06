import fs from 'node:fs';
import path from 'node:path';
import { ShopifyClient } from '../shopify/client.js';
import { config } from '../config.js';

export async function blockCustomerCOD(rawPhone, reason = 'High RTO risk profile') {
  const phone10 = String(rawPhone).replace(/\D/g, '').slice(-10);
  if (!phone10 || phone10.length !== 10) {
    throw new Error(`Invalid phone number: ${rawPhone}`);
  }

  console.log(`[Block COD] Processing phone: +91 ${phone10}...`);

  // 1. Persist to blocked-phones.json
  const blockedFile = path.join(config.dataDir, 'blocked-phones.json');
  let blockedList = [];
  if (fs.existsSync(blockedFile)) {
    try {
      blockedList = JSON.parse(fs.readFileSync(blockedFile, 'utf8'));
    } catch {
      blockedList = [];
    }
  }

  const existingIdx = blockedList.findIndex(b => b.phone === phone10);
  const blockRecord = {
    phone: phone10,
    blocked_at: new Date().toISOString(),
    reason: reason,
  };

  if (existingIdx >= 0) {
    blockedList[existingIdx] = blockRecord;
  } else {
    blockedList.push(blockRecord);
  }
  fs.writeFileSync(blockedFile, JSON.stringify(blockedList, null, 2));
  console.log(`[Block COD] Saved to ${blockedFile} (Total blocked: ${blockedList.length})`);

  // 2. Search and Tag in Shopify
  const client = new ShopifyClient();
  const token = await client.getAccessToken();
  const store = client.storeUrl;
  const apiVer = client.apiVersion;

  // Search Customer
  console.log(`[Shopify] Searching customer with phone: ${phone10}...`);
  const custRes = await client.request(`/customers/search.json?query=phone:${phone10}`);
  const customers = custRes.data?.customers || [];

  for (const c of customers) {
    console.log(`[Shopify] Found Customer: ${c.first_name} ${c.last_name} (ID: ${c.id})`);
    const existingTags = c.tags ? c.tags.split(',').map(t => t.trim()) : [];
    if (!existingTags.includes('COD_BLOCKED')) existingTags.push('COD_BLOCKED');
    if (!existingTags.includes('HIGH_RTO_RISK')) existingTags.push('HIGH_RTO_RISK');

    const updateUrl = `https://${store}/admin/api/${apiVer}/customers/${c.id}.json`;
    await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        customer: {
          id: c.id,
          tags: existingTags.join(', '),
          note: `🚨 COD BLOCKED (${new Date().toLocaleDateString('en-IN')}): ${reason}. Only Prepaid allowed.`
        }
      })
    });
    console.log(`[Shopify] Customer tagged COD_BLOCKED successfully!`);
  }

  // Search Orders
  console.log(`[Shopify] Searching recent orders for phone: ${phone10}...`);
  const ordersRes = await client.request(`/orders.json?query=${phone10}&status=any`);
  const orders = ordersRes.data?.orders || [];

  const updatedOrders = [];
  for (const o of orders) {
    console.log(`[Shopify] Found Order: ${o.name} (ID: ${o.id}, Status: ${o.financial_status}, Fulfillment: ${o.fulfillment_status || 'unfulfilled'})`);
    const existingTags = o.tags ? o.tags.split(',').map(t => t.trim()) : [];
    if (!existingTags.includes('COD_BLOCKED')) existingTags.push('COD_BLOCKED');
    if (!existingTags.includes('DO_NOT_DISPATCH')) existingTags.push('DO_NOT_DISPATCH');

    const updateUrl = `https://${store}/admin/api/${apiVer}/orders/${o.id}.json`;
    await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        order: {
          id: o.id,
          tags: existingTags.join(', '),
          note: `🚨 COD BLOCKED: ${reason}. DO NOT DISPATCH ON COD. Hold fulfillment or ask customer for Prepaid.`
        }
      })
    });
    console.log(`[Shopify] Order ${o.name} tagged COD_BLOCKED & DO_NOT_DISPATCH!`);
    updatedOrders.push({
      id: o.id,
      name: o.name,
      financial: o.financial_status,
      fulfillment: o.fulfillment_status,
      total: o.total_price
    });
  }

  return {
    phone: phone10,
    customersTagged: customers.length,
    ordersTagged: updatedOrders
  };
}

// CLI Runner
const phoneArg = process.argv[2] || '9428549379';
blockCustomerCOD(phoneArg)
  .then(res => {
    console.log('\n--- SUCCESS ---');
    console.log(JSON.stringify(res, null, 2));
  })
  .catch(err => {
    console.error('Error blocking COD:', err);
    process.exit(1);
  });
