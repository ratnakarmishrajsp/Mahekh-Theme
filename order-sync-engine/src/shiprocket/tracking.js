import { ShiprocketClient } from './client.js';

export class ShiprocketTrackingManager {
  constructor(client = new ShiprocketClient()) {
    this.client = client;
  }

  /**
   * Track by AWB Number
   */
  async trackByAwb(awb) {
    if (!awb) return null;
    const cleanAwb = String(awb).trim();
    try {
      const response = await this.client.request(`/courier/track/awb/${cleanAwb}`);
      const trackingData = response.tracking_data || {};
      const shipment = (trackingData.shipment_track && trackingData.shipment_track[0]) || {};
      const activities = (trackingData.shipment_track_activities && trackingData.shipment_track_activities) || [];

      return {
        awb: cleanAwb,
        current_status: shipment.current_status || 'UNKNOWN',
        delivered_date: shipment.delivered_date || null,
        courier_name: shipment.courier_name || 'N/A',
        origin: shipment.origin || '',
        destination: shipment.destination || '',
        expected_delivery: shipment.edd || null,
        pickup_date: shipment.pickup_date || null,
        track_status: shipment.track_status || 0,
        pod_status: shipment.pod_status || '',
        activity_history: activities.map((act) => ({
          date: act.date,
          status: act.status || act['sr-status-label'],
          activity: act.activity,
          location: act.location,
        })),
        raw: shipment,
      };
    } catch (err) {
      console.warn(`[Shiprocket] Could not track AWB ${cleanAwb}: ${err.message}`);
      return {
        awb: cleanAwb,
        current_status: 'NOT_FOUND_OR_ERROR',
        error: err.message,
      };
    }
  }

  /**
   * Track by Channel Order ID or Shiprocket Order ID
   */
  async trackByOrderId(orderId, channelId = '') {
    try {
      const q = channelId ? `order_id=${orderId}&channel_id=${channelId}` : `order_id=${orderId}`;
      const response = await this.client.request(`/courier/track?${q}`);
      return response;
    } catch (err) {
      console.warn(`[Shiprocket] Could not track Order ID ${orderId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Fetch All Shiprocket Orders (paginated)
   */
  async fetchAllShiprocketOrders(maxPages = 5) {
    const allOrders = [];
    let page = 1;

    console.log('[Shiprocket] Fetching Shiprocket orders...');
    while (page <= maxPages) {
      try {
        const response = await this.client.request(`/orders?page=${page}&per_page=100`);
        const orders = response.data || [];
        if (orders.length === 0) break;

        allOrders.push(...orders);
        console.log(`[Shiprocket] Page ${page}: Fetched ${orders.length} shipments (Total: ${allOrders.length})`);
        if (page >= (response.meta?.pagination?.total_pages || 1)) break;
        page++;
      } catch (err) {
        console.warn(`[Shiprocket] Error fetching page ${page}: ${err.message}`);
        break;
      }
    }

    console.log(`[Shiprocket] Successfully fetched ${allOrders.length} Shiprocket orders.`);
    return allOrders.map((o) => this.normalizeShiprocketOrder(o));
  }

  normalizeShiprocketOrder(order) {
    const shipments = order.shipments || [];
    const primaryShipment = shipments[0] || {};

    return {
      shiprocket_order_id: order.id,
      channel_order_id: String(order.channel_order_id || ''),
      channel_name: order.channel_name || '',
      status: order.status || '',
      status_code: order.status_code,
      payment_method: order.payment_method || 'COD',
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      customer_phone: String(order.customer_phone || '').replace(/[^0-9+]/g, ''),
      customer_city: order.customer_city || '',
      customer_state: order.customer_state || '',
      customer_pincode: order.customer_pincode || '',
      total: parseFloat(order.total || '0'),
      awb_code: primaryShipment.awb || order.awb_code || '',
      courier_name: primaryShipment.courier || order.courier_name || 'N/A',
      created_at: order.created_at,
      rto_status: order.rto_status || '',
      shipment_id: primaryShipment.id || null,
      raw: order,
    };
  }

  /**
   * Fetch Active NDR (Non-Delivery Reports)
   */
  async fetchNDRReports() {
    try {
      console.log('[Shiprocket] Fetching NDR (Non-Delivery Reports)...');
      const response = await this.client.request('/ndr/all');
      const ndrList = response.data || [];
      console.log(`[Shiprocket] Found ${ndrList.length} NDR cases.`);
      return ndrList.map((item) => ({
        awb: item.awb_code,
        order_id: item.order_id,
        channel_order_id: item.channel_order_id,
        courier_name: item.courier_name,
        attempts: item.undelivered_attempts,
        last_reason: item.last_ndr_reason,
        status: item.status,
        customer_phone: item.customer_phone,
      }));
    } catch (err) {
      console.warn(`[Shiprocket] Could not fetch NDR reports: ${err.message}`);
      return [];
    }
  }

  /**
   * Courier performance breakdown
   */
  calculateCourierPerformance(shiprocketOrders) {
    const couriers = {};

    for (const order of shiprocketOrders) {
      const name = order.courier_name || 'Unassigned';
      if (!couriers[name]) {
        couriers[name] = {
          name,
          total_shipments: 0,
          delivered: 0,
          rto: 0,
          in_transit: 0,
          pending: 0,
        };
      }

      const st = (order.status || '').toUpperCase();
      couriers[name].total_shipments++;

      if (st.includes('DELIVERED')) {
        couriers[name].delivered++;
      } else if (st.includes('RTO')) {
        couriers[name].rto++;
      } else if (st.includes('TRANSIT') || st.includes('PICKED') || st.includes('OUT FOR DELIVERY')) {
        couriers[name].in_transit++;
      } else {
        couriers[name].pending++;
      }
    }

    return Object.values(couriers).map((c) => ({
      ...c,
      delivery_rate: c.total_shipments > 0 ? ((c.delivered / c.total_shipments) * 100).toFixed(1) + '%' : '0%',
      rto_rate: c.total_shipments > 0 ? ((c.rto / c.total_shipments) * 100).toFixed(1) + '%' : '0%',
    }));
  }
}
