import { config } from '../config.js';

export class MetaAdsClient {
  constructor(options = {}) {
    this.accessToken = options.accessToken || config.meta?.accessToken || process.env.META_ACCESS_TOKEN;
    this.adAccountId = options.adAccountId || config.meta?.adAccountId || process.env.META_AD_ACCOUNT_ID || 'act_999512922160500';
    this.gstRate = 0.18; // 18% GST on Meta Ad spend in India
    this.apiVersion = 'v20.0';
    this.baseUrl = 'https://graph.facebook.com';
  }

  async fetch(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}/${this.apiVersion}/${endpoint}`);
    url.searchParams.set('access_token', this.accessToken);
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    }

    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.error) {
      throw new Error(`[Meta API] ${data.error.message} (code ${data.error.code})`);
    }
    return data;
  }

  async getAccountOverview() {
    const data = await this.fetch(this.adAccountId, {
      fields: 'name,currency,account_status,timezone_name,balance,amount_spent',
    });
    return data;
  }

  /**
   * Fetch aggregate insights
   * @param {string} datePreset e.g. 'today', 'yesterday', 'last_7d', 'last_30d', 'this_month'
   */
  async getInsights(datePreset = 'today') {
    const data = await this.fetch(`${this.adAccountId}/insights`, {
      date_preset: datePreset,
      fields: 'spend,impressions,clicks,cpc,cpm,ctr,reach,actions,purchase_roas,cost_per_action_type',
    });

    const row = data.data?.[0] || {};
    const baseSpend = parseFloat(row.spend || '0');
    const gstAmount = Math.round(baseSpend * this.gstRate * 100) / 100;
    const spendWithGST = Math.round((baseSpend + gstAmount) * 100) / 100;

    // Extract purchases & conversions
    const actions = row.actions || [];
    const purchaseAction = actions.find(a => 
      a.action_type === 'purchase' || 
      a.action_type === 'omni_purchase' ||
      a.action_type === 'offsite_conversion.fb_pixel_purchase'
    );
    const purchases = purchaseAction ? parseInt(purchaseAction.value, 10) : 0;

    const atcAction = actions.find(a => a.action_type === 'add_to_cart' || a.action_type === 'omni_add_to_cart');
    const addToCart = atcAction ? parseInt(atcAction.value, 10) : 0;

    const icAction = actions.find(a => a.action_type === 'initiate_checkout' || a.action_type === 'omni_initiated_checkout');
    const initiateCheckout = icAction ? parseInt(icAction.value, 10) : 0;

    const roasAction = row.purchase_roas?.find(r => r.action_type === 'omni_purchase' || r.action_type === 'purchase');
    const metaRoas = roasAction ? parseFloat(roasAction.value) : 0;

    return {
      datePreset,
      dateStart: row.date_start,
      dateStop: row.date_stop,
      baseSpend,
      gstRatePercent: 18,
      gstAmount,
      spendWithGST,
      impressions: parseInt(row.impressions || '0', 10),
      clicks: parseInt(row.clicks || '0', 10),
      reach: parseInt(row.reach || '0', 10),
      cpc: parseFloat(row.cpc || '0'),
      cpm: parseFloat(row.cpm || '0'),
      ctr: parseFloat(row.ctr || '0'),
      purchases,
      addToCart,
      initiateCheckout,
      metaRoas,
    };
  }

  /**
   * Fetch campaign breakdown
   */
  async getCampaigns(datePreset = 'today') {
    const data = await this.fetch(`${this.adAccountId}/campaigns`, {
      fields: 'id,name,status,effective_status,daily_budget,lifetime_budget,insights.date_preset(' + datePreset + '){spend,impressions,clicks,cpc,cpm,ctr,actions,purchase_roas}',
      limit: 50,
    });

    const campaigns = (data.data || []).map(camp => {
      const insight = camp.insights?.data?.[0] || {};
      const baseSpend = parseFloat(insight.spend || '0');
      const spendWithGST = Math.round(baseSpend * 1.18 * 100) / 100;
      const roasAction = insight.purchase_roas?.find(r => r.action_type === 'omni_purchase' || r.action_type === 'purchase');
      const metaRoas = roasAction ? parseFloat(roasAction.value) : 0;
      
      const purchaseAction = (insight.actions || []).find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
      const purchases = purchaseAction ? parseInt(purchaseAction.value, 10) : 0;

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status,
        effective_status: camp.effective_status,
        daily_budget: camp.daily_budget ? parseFloat(camp.daily_budget) / 100 : null,
        baseSpend,
        spendWithGST,
        purchases,
        metaRoas,
        impressions: parseInt(insight.impressions || '0', 10),
        clicks: parseInt(insight.clicks || '0', 10),
        cpc: parseFloat(insight.cpc || '0'),
      };
    });

    return campaigns;
  }
}
