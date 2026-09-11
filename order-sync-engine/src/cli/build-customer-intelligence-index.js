import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const workspaceRoot = 'c:\\Users\\Ratnakar\\Desktop\\Mahekh theme';
const syncFile = path.join(config.dataDir, 'unified_sync.json');

function checkAddressQuality(addressStr) {
  if (!addressStr || addressStr.length < 10) {
    return {
      status: 'INCOMPLETE',
      label: '⚠️ Incomplete Address (Missing House/Street Details)'
    };
  }
  const hasNumber = /\d+/.test(addressStr);
  const hasStreet = /(flat|house|h\.no|plot|room|gali|lane|street|road|rd|nagar|colony|sector|block|floor|opp|near|behind|apart|building)/i.test(addressStr);
  
  if (hasNumber && hasStreet) {
    return {
      status: 'GOOD',
      label: '🟢 Complete Address (House & Street present)'
    };
  } else if (hasStreet) {
    return {
      status: 'MODERATE',
      label: '🟡 Moderate (Street/Landmark present, verify House No)'
    };
  } else {
    return {
      status: 'INCOMPLETE',
      label: '⚠️ Incomplete (Missing House/Gali No - Courier may fail)'
    };
  }
}

export function buildCustomerIntelligenceIndex() {
  if (!fs.existsSync(syncFile)) {
    throw new Error(`Sync file not found at ${syncFile}`);
  }

  const syncData = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
  const rawOrders = syncData.orders || [];

  // Group by phone number (last 10 digits)
  const customerMap = new Map();

  for (const o of rawOrders) {
    const rawPhone = String(o.customer_phone || '').replace(/\D/g, '');
    const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : (rawPhone || 'UNKNOWN');
    
    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        phone: phone,
        name: o.customer_name || 'Customer',
        city: o.customer_city || 'India',
        pincode: o.customer_pincode || '',
        addresses: [],
        cities: new Set(),
        orders: [],
      });
    }

    const c = customerMap.get(phone);
    if (o.customer_city) c.cities.add(o.customer_city.trim().toLowerCase());
    
    const addr = [o.customer_city, o.customer_pincode].filter(Boolean).join(' - ');
    if (addr && !c.addresses.includes(addr)) {
      c.addresses.push(addr);
    }

    const statusUpper = String(o.shiprocket_status || o.unified_status || '').toUpperCase();
    const isDelivered = statusUpper.includes('DELIVERED') && !statusUpper.includes('RTO');
    const isRto = statusUpper.includes('RTO') || statusUpper.includes('CANCEL');
    const isInTransit = statusUpper.includes('TRANSIT') || statusUpper.includes('PICKED UP') || statusUpper.includes('SHIPPED');

    c.orders.push({
      order_id: o.shopify_order_id,
      name: o.order_name || (`#MA${o.order_number}`),
      num: String(o.order_number || ''),
      date: o.created_at ? o.created_at.split('T')[0] : 'Recent',
      amount: Number(o.total_price || 0),
      payment_mode: o.payment_mode || 'COD',
      items: o.items || 'Fragrance Bottle',
      courier: o.courier_name && o.courier_name !== 'N/A' ? o.courier_name : (o.awb ? 'Shiprocket Logistics' : 'Pending Allocation'),
      awb: o.awb && o.awb !== 'NOT_ASSIGNED' ? o.awb : null,
      status: o.shiprocket_status || 'CONFIRMED',
      isDelivered: isDelivered,
      isRto: isRto,
      isInTransit: isInTransit,
      ndr: o.ndr || null,
      track_url: o.awb && o.awb !== 'NOT_ASSIGNED' ? `https://shiprocket.co/tracking/${o.awb}` : null,
      city: o.customer_city || '',
      pincode: o.customer_pincode || ''
    });
  }

  // Calculate metrics for each customer
  const customerList = [];

  for (const [phone, data] of customerMap.entries()) {
    // Sort orders newest first
    data.orders.sort((a, b) => Number(b.num) - Number(a.num));

    const totalOrders = data.orders.length;
    const deliveredCount = data.orders.filter(o => o.isDelivered).length;
    const rtoCount = data.orders.filter(o => o.isRto).length;
    const inTransitCount = data.orders.filter(o => o.isInTransit).length;
    const totalSpent = data.orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const aov = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
    const codCount = data.orders.filter(o => o.payment_mode.toUpperCase() === 'COD').length;
    const prepaidCount = totalOrders - codCount;

    // Trust & Risk Heuristics
    let trustBadge = 'NEW BUYER (1st Order)';
    let trustColor = 'gold';
    let riskLevel = 'LOW_MEDIUM';

    if (rtoCount > 0) {
      trustBadge = `🚨 HIGH RTO RISK (${rtoCount} Returned)`;
      trustColor = 'red';
      riskLevel = 'HIGH';
    } else if (deliveredCount >= 1) {
      trustBadge = totalOrders > 1 ? `👑 VIP REPEAT BUYER (${deliveredCount} Delivered)` : `🟢 VERIFIED BUYER (${deliveredCount} Delivered)`;
      trustColor = 'green';
      riskLevel = 'VERY_LOW';
    } else if (totalOrders > 1 && deliveredCount === 0 && rtoCount === 0) {
      trustBadge = `⚡ MULTI-ORDER IN TRANSIT (${inTransitCount} In Transit)`;
      trustColor = 'blue';
      riskLevel = 'MEDIUM';
    }

    // Multi-location check
    const isMultiLocation = data.cities.size > 1;

    // Address check for the latest order
    const latestOrder = data.orders[0];
    const latestAddrStr = [latestOrder.city, latestOrder.pincode].filter(Boolean).join(' ');
    const addressCheck = checkAddressQuality(latestAddrStr);

    customerList.push({
      phone: phone,
      name: data.name,
      city: data.city,
      pincode: data.pincode,
      totalOrders: totalOrders,
      deliveredOrders: deliveredCount,
      rtoOrders: rtoCount,
      inTransitOrders: inTransitCount,
      totalSpent: totalSpent,
      aov: aov,
      codRatio: `${Math.round((codCount / totalOrders) * 100)}% COD`,
      trustBadge: trustBadge,
      trustColor: trustColor,
      isMultiLocation: isMultiLocation,
      addressQuality: addressCheck.label,
      addressStatus: addressCheck.status,
      orders: data.orders.map(o => ({
        name: o.name,
        num: o.num,
        date: o.date,
        amount: o.amount,
        payment_mode: o.payment_mode,
        items: o.items,
        courier: o.courier,
        awb: o.awb,
        status: o.status,
        ndr: o.ndr,
        city: o.city,
        pincode: o.pincode
      }))
    });
  }

  const outputPath = path.join(workspaceRoot, 'assets', 'mahekh-customer-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(customerList));
  const stats = fs.statSync(outputPath);

  console.log(`✔ Generated Customer Intelligence Index with ${customerList.length} profiles at ${outputPath}`);
  console.log(`  File size: ${(stats.size / 1024).toFixed(1)} KB\n`);
  return outputPath;
}

buildCustomerIntelligenceIndex();
