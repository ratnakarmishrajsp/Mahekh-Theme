export class OrderIntelligence {
  /**
   * Cross-reference Shopify orders with Shiprocket orders
   */
  static joinOrders(shopifyOrders = [], shiprocketOrders = [], ndrList = []) {
    // Index Shiprocket orders by channel_order_id (cleaned), by AWB, and by phone
    const srByChannelId = new Map();
    const srByAwb = new Map();
    const srByPhone = new Map();

    for (const sr of shiprocketOrders) {
      const cleanChannelId = String(sr.channel_order_id || '').replace(/^#/, '').trim();
      if (cleanChannelId) {
        srByChannelId.set(cleanChannelId, sr);
      }
      if (sr.awb_code) {
        srByAwb.set(String(sr.awb_code).trim(), sr);
      }
      if (sr.customer_phone) {
        const p = sr.customer_phone.slice(-10);
        if (p.length === 10) {
          if (!srByPhone.has(p)) srByPhone.set(p, []);
          srByPhone.get(p).push(sr);
        }
      }
    }

    // Index NDR by AWB and channel_order_id
    const ndrByAwb = new Map();
    for (const ndr of ndrList) {
      if (ndr.awb) ndrByAwb.set(String(ndr.awb).trim(), ndr);
      if (ndr.channel_order_id) {
        const clean = String(ndr.channel_order_id).replace(/^#/, '').trim();
        ndrByAwb.set(clean, ndr);
      }
    }

    const unifiedList = [];

    for (const shopify of shopifyOrders) {
      const cleanOrderNum = String(shopify.order_number || shopify.name || '').replace(/^#/, '').trim();

      // Find matching Shiprocket shipment
      let matchedSR = srByChannelId.get(cleanOrderNum);

      // Try matching by tracking number from Shopify fulfillments
      if (!matchedSR && shopify.tracking_numbers?.length > 0) {
        for (const tNum of shopify.tracking_numbers) {
          matchedSR = srByAwb.get(String(tNum).trim());
          if (matchedSR) break;
        }
      }

      // Try matching by phone
      if (!matchedSR && shopify.customer?.phone) {
        const p = shopify.customer.phone.slice(-10);
        const candidates = srByPhone.get(p) || [];
        if (candidates.length === 1) {
          matchedSR = candidates[0];
        } else if (candidates.length > 1) {
          // Match closest total
          matchedSR = candidates.find((c) => Math.abs(c.total - shopify.total_price) < 2) || candidates[0];
        }
      }

      // Check NDR status
      const awb = matchedSR?.awb_code || (shopify.tracking_numbers && shopify.tracking_numbers[0]) || '';
      const matchedNDR = ndrByAwb.get(awb) || ndrByAwb.get(cleanOrderNum);

      // Determine operational unified status
      const unifiedStatus = this.determineOperationalStatus(shopify, matchedSR, matchedNDR);

      unifiedList.push({
        shopify_order_id: shopify.id,
        order_number: shopify.order_number,
        order_name: shopify.name,
        created_at: shopify.created_at,
        customer_name: shopify.customer?.name || 'N/A',
        customer_phone: shopify.customer?.phone || '',
        customer_city: shopify.shipping_address?.city || matchedSR?.customer_city || '',
        customer_pincode: shopify.shipping_address?.zip || matchedSR?.customer_pincode || '',
        payment_mode: shopify.payment_mode,
        total_price: shopify.total_price,
        items: (shopify.line_items || []).map((i) => `${i.title} (x${i.quantity})`).join(', '),
        // Logistics details
        shiprocket_order_id: matchedSR?.shiprocket_order_id || null,
        awb: awb || 'NOT_ASSIGNED',
        courier_name: matchedSR?.courier_name || 'N/A',
        shiprocket_status: matchedSR?.status || (shopify.fulfillment_status === 'fulfilled' ? 'FULFILLED_IN_SHOPIFY' : 'NOT_SYNCED'),
        ndr: matchedNDR
          ? {
              is_ndr: true,
              attempts: matchedNDR.attempts,
              reason: matchedNDR.last_reason,
            }
          : null,
        unified_status: unifiedStatus,
      });
    }

    return unifiedList;
  }

  static determineOperationalStatus(shopify, shiprocket, ndr) {
    if (shopify.cancelled_at) {
      return 'CANCELLED_IN_SHOPIFY';
    }

    if (ndr) {
      return 'NDR_ACTION_REQUIRED';
    }

    if (!shiprocket) {
      if (shopify.fulfillment_status === 'fulfilled') {
        return 'FULFILLED_MANUAL_OR_OTHER';
      }
      return 'PENDING_BOOKING_IN_SHIPROCKET';
    }

    const srStatus = (shiprocket.status || '').toUpperCase();

    if (srStatus.includes('DELIVERED') && !srStatus.includes('RTO')) {
      return 'DELIVERED';
    }
    if (srStatus.includes('RTO DELIVERED')) {
      return 'RTO_DELIVERED';
    }
    if (srStatus.includes('RTO INITIATED') || srStatus.includes('RTO IN TRANSIT') || srStatus.includes('RTO OFD')) {
      return 'RTO_IN_TRANSIT';
    }
    if (srStatus.includes('OUT FOR DELIVERY')) {
      return 'OUT_FOR_DELIVERY';
    }
    if (srStatus.includes('IN TRANSIT') || srStatus.includes('SHIPPED') || srStatus.includes('PICKED UP')) {
      return 'IN_TRANSIT';
    }
    if (srStatus.includes('AWB ASSIGNED') || srStatus.includes('READY TO SHIP')) {
      return 'AWB_ASSIGNED_PENDING_PICKUP';
    }
    if (srStatus.includes('CANCELED')) {
      return 'CANCELLED_IN_SHIPROCKET';
    }

    return srStatus || 'PENDING';
  }

  /**
   * Compute comprehensive Delivery vs RTO metrics
   */
  static calculateDeliveryAndRtoMetrics(unifiedList = []) {
    let total = unifiedList.length;
    let delivered = 0;
    let rto = 0;
    let inTransit = 0;
    let outForDelivery = 0;
    let ndrCount = 0;
    let pendingBooking = 0;
    let cancelled = 0;

    let codTotal = 0;
    let codDelivered = 0;
    let codRto = 0;

    let prepaidTotal = 0;
    let prepaidDelivered = 0;
    let prepaidRto = 0;

    for (const item of unifiedList) {
      const isCod = item.payment_mode === 'COD';
      const st = item.unified_status;

      if (isCod) codTotal++;
      else prepaidTotal++;

      if (st.includes('DELIVERED') && !st.includes('RTO')) {
        delivered++;
        if (isCod) codDelivered++;
        else prepaidDelivered++;
      } else if (st.includes('RTO')) {
        rto++;
        if (isCod) codRto++;
        else prepaidRto++;
      } else if (st === 'OUT_FOR_DELIVERY') {
        outForDelivery++;
      } else if (st === 'IN_TRANSIT' || st === 'AWB_ASSIGNED_PENDING_PICKUP') {
        inTransit++;
      } else if (st === 'NDR_ACTION_REQUIRED') {
        ndrCount++;
      } else if (st === 'PENDING_BOOKING_IN_SHIPROCKET') {
        pendingBooking++;
      } else if (st.includes('CANCELLED')) {
        cancelled++;
      }
    }

    const shippedCount = delivered + rto + inTransit + outForDelivery + ndrCount;
    const closedShipments = delivered + rto;

    const deliverySuccessRate = closedShipments > 0 ? ((delivered / closedShipments) * 100).toFixed(1) : '0.0';
    const rtoRate = closedShipments > 0 ? ((rto / closedShipments) * 100).toFixed(1) : '0.0';

    const codRtoRate = codDelivered + codRto > 0 ? ((codRto / (codDelivered + codRto)) * 100).toFixed(1) : '0.0';
    const prepaidRtoRate = prepaidDelivered + prepaidRto > 0 ? ((prepaidRto / (prepaidDelivered + prepaidRto)) * 100).toFixed(1) : '0.0';

    return {
      total_orders: total,
      shipped_orders: shippedCount,
      delivered_orders: delivered,
      rto_orders: rto,
      in_transit_orders: inTransit,
      out_for_delivery_orders: outForDelivery,
      ndr_cases: ndrCount,
      pending_booking_orders: pendingBooking,
      cancelled_orders: cancelled,
      delivery_success_rate: `${deliverySuccessRate}%`,
      rto_rate: `${rtoRate}%`,
      cod_performance: {
        total: codTotal,
        delivered: codDelivered,
        rto: codRto,
        rto_rate: `${codRtoRate}%`,
      },
      prepaid_performance: {
        total: prepaidTotal,
        delivered: prepaidDelivered,
        rto: prepaidRto,
        rto_rate: `${prepaidRtoRate}%`,
      },
    };
  }
}
