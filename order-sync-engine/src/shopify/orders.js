import { ShopifyClient } from './client.js';

export class ShopifyOrderManager {
  constructor(client = new ShopifyClient()) {
    this.client = client;
  }

  cleanPhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^0-9+]/g, '').trim();
  }

  normalizeOrder(order) {
    const customer = order.customer || {};
    const shipping = order.shipping_address || {};
    const billing = order.billing_address || {};

    const phone =
      this.cleanPhone(shipping.phone) ||
      this.cleanPhone(customer.phone) ||
      this.cleanPhone(billing.phone) ||
      this.cleanPhone(order.phone) ||
      '';

    const customerName = [shipping.first_name || customer.first_name || '', shipping.last_name || customer.last_name || '']
      .join(' ')
      .trim() || 'Guest Customer';

    const gatewayNames = (order.payment_gateway_names || []).map((g) => g.toLowerCase());
    const isCOD =
      gatewayNames.some((g) => g.includes('cod') || g.includes('cash on delivery')) ||
      (order.financial_status === 'pending' && !gatewayNames.includes('razorpay') && !gatewayNames.includes('phonepe'));

    // Extract fulfillment tracking info if already filled
    const fulfillments = (order.fulfillments || []).map((f) => ({
      id: f.id,
      status: f.status,
      tracking_company: f.tracking_company,
      tracking_number: f.tracking_number,
      tracking_numbers: f.tracking_numbers || [],
      tracking_url: f.tracking_url,
      created_at: f.created_at,
    }));

    const allTrackingNumbers = fulfillments.flatMap((f) => [f.tracking_number, ...(f.tracking_numbers || [])]).filter(Boolean);

    return {
      id: String(order.id),
      order_number: order.order_number,
      name: order.name, // e.g. "#1001"
      created_at: order.created_at,
      financial_status: order.financial_status, // paid, pending, refunded, voided
      fulfillment_status: order.fulfillment_status || 'unfulfilled',
      cancelled_at: order.cancelled_at,
      cancel_reason: order.cancel_reason,
      currency: order.currency,
      total_price: parseFloat(order.total_price || '0'),
      subtotal_price: parseFloat(order.subtotal_price || '0'),
      total_discounts: parseFloat(order.total_discounts || '0'),
      is_cod: isCOD,
      payment_mode: isCOD ? 'COD' : 'PREPAID',
      payment_gateways: order.payment_gateway_names || [],
      customer: {
        id: customer.id ? String(customer.id) : null,
        name: customerName,
        email: customer.email || order.email || '',
        phone,
      },
      shipping_address: {
        name: [shipping.first_name, shipping.last_name].filter(Boolean).join(' '),
        address1: shipping.address1 || '',
        address2: shipping.address2 || '',
        city: shipping.city || '',
        province: shipping.province || '',
        zip: shipping.zip || '',
        country: shipping.country || 'India',
        phone: this.cleanPhone(shipping.phone),
      },
      line_items: (order.line_items || []).map((item) => ({
        id: String(item.id),
        title: item.title,
        variant_title: item.variant_title,
        sku: item.sku || 'N/A',
        quantity: item.quantity,
        price: parseFloat(item.price || '0'),
      })),
      fulfillments,
      tracking_numbers: allTrackingNumbers,
    };
  }

  async fetchAllOrders(options = {}) {
    const params = {
      status: options.status || 'any', // open, closed, cancelled, any
      ...options,
    };

    console.log(`[Shopify] Fetching all orders (status: ${params.status})...`);
    const rawOrders = await this.client.paginate('/orders.json', 'orders', params);
    console.log(`[Shopify] Successfully fetched ${rawOrders.length} orders.`);

    return rawOrders.map((order) => this.normalizeOrder(order));
  }

  async fetchAbandonedCheckouts(options = {}) {
    try {
      const rawCheckouts = await this.client.paginate('/checkouts.json', 'checkouts', options);
      return rawCheckouts.map((c) => ({
        id: String(c.id),
        created_at: c.created_at,
        subtotal_price: parseFloat(c.subtotal_price || '0'),
        total_price: parseFloat(c.total_price || '0'),
        email: c.email,
        phone: c.phone,
        abandoned_checkout_url: c.abandoned_checkout_url,
      }));
    } catch (err) {
      console.warn(`[Shopify] Note: Checkouts endpoint returned: ${err.message}`);
      return [];
    }
  }

  calculateMetrics(orders) {
    let grossRevenue = 0;
    let totalDiscounts = 0;
    let codCount = 0;
    let codRevenue = 0;
    let prepaidCount = 0;
    let prepaidRevenue = 0;
    let fulfilledCount = 0;
    let unfulfilledCount = 0;
    let cancelledCount = 0;

    for (const order of orders) {
      if (order.cancelled_at) {
        cancelledCount++;
        continue; // Exclude cancelled from active gross revenue
      }

      grossRevenue += order.total_price;
      totalDiscounts += order.total_discounts;

      if (order.is_cod) {
        codCount++;
        codRevenue += order.total_price;
      } else {
        prepaidCount++;
        prepaidRevenue += order.total_price;
      }

      if (order.fulfillment_status === 'fulfilled') {
        fulfilledCount++;
      } else {
        unfulfilledCount++;
      }
    }

    const activeOrders = orders.length - cancelledCount;
    const aov = activeOrders > 0 ? (grossRevenue / activeOrders).toFixed(2) : 0;

    return {
      total_orders: orders.length,
      active_orders: activeOrders,
      cancelled_orders: cancelledCount,
      fulfilled_orders: fulfilledCount,
      unfulfilled_orders: unfulfilledCount,
      gross_revenue: Math.round(grossRevenue),
      total_discounts: Math.round(totalDiscounts),
      average_order_value: Number(aov),
      cod: {
        count: codCount,
        revenue: Math.round(codRevenue),
        percentage: activeOrders > 0 ? ((codCount / activeOrders) * 100).toFixed(1) : 0,
      },
      prepaid: {
        count: prepaidCount,
        revenue: Math.round(prepaidRevenue),
        percentage: activeOrders > 0 ? ((prepaidCount / activeOrders) * 100).toFixed(1) : 0,
      },
    };
  }
}
