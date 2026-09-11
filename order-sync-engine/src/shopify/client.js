import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export class ShopifyClient {
  constructor(customConfig = {}) {
    this.storeUrl = customConfig.storeUrl || config.shopify.storeUrl;
    this.clientId = customConfig.clientId || config.shopify.clientId;
    this.clientSecret = customConfig.clientSecret || config.shopify.clientSecret;
    this.accessToken = customConfig.accessToken || config.shopify.accessToken;
    this.apiVersion = customConfig.apiVersion || config.shopify.apiVersion;
    this.tokenFilePath = path.join(config.dataDir, 'shopify_token.json');
  }

  getBaseUrl() {
    if (!this.storeUrl) {
      throw new Error('Shopify Store URL is not configured. Please set SHOPIFY_STORE_URL in .env');
    }
    return `https://${this.storeUrl}/admin/api/${this.apiVersion}`;
  }

  getCachedToken() {
    try {
      if (fs.existsSync(this.tokenFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.tokenFilePath, 'utf8'));
        const expiresAt = new Date(data.expires_at).getTime();
        if (expiresAt - Date.now() > 300000) {
          return data.access_token;
        }
      }
    } catch {
      // Ignore cache error
    }
    return null;
  }

  saveToken(accessToken, expiresInSeconds = 86400) {
    try {
      const payload = {
        access_token: accessToken,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      };
      fs.writeFileSync(this.tokenFilePath, JSON.stringify(payload, null, 2));
    } catch (err) {
      console.warn(`[Shopify] Could not cache access token: ${err.message}`);
    }
  }

  async getAccessToken(forceRefresh = false) {
    if (this.accessToken && !this.clientId) {
      return this.accessToken;
    }

    if (!forceRefresh) {
      const cached = this.getCachedToken();
      if (cached) return cached;
    }

    if (!this.clientId || !this.clientSecret) {
      if (this.accessToken) return this.accessToken;
      throw new Error('Shopify Client ID and Secret are missing.');
    }

    console.log(`[Shopify] Authenticating via OAuth client_credentials grant...`);
    const tokenUrl = `https://${this.storeUrl}/admin/oauth/access_token`;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Shopify Token Exchange Failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const token = data.access_token;
    const expiresIn = data.expires_in || 86400;

    this.saveToken(token, expiresIn);
    console.log(`[Shopify] Authentication successful! 24-hour Access Token cached.`);
    return token;
  }

  async request(endpoint, options = {}, isRetry = false) {
    const token = await this.getAccessToken(isRetry);
    const url = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
      ...options.headers,
    };

    let retries = 0;
    const maxRetries = 5;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (response.status === 401 && !isRetry) {
          console.warn('[Shopify] Token unauthorized (401). Refreshing token and retrying...');
          return this.request(endpoint, options, true);
        }

        const apiLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
        if (apiLimit) {
          const [used, total] = apiLimit.split('/').map(Number);
          if (used / total > 0.8) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        if (response.status === 429) {
          retries++;
          const retryAfter = parseFloat(response.headers.get('Retry-After') || '2.0');
          console.warn(`[Shopify] Rate limited (429). Retrying in ${retryAfter}s...`);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Shopify API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const linkHeader = response.headers.get('Link');
        const nextUrl = this.parseNextPageUrl(linkHeader);

        return { data, nextUrl };
      } catch (err) {
        if (retries >= maxRetries) throw err;
        retries++;
        const backoff = Math.pow(2, retries) * 500;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  parseNextPageUrl(linkHeader) {
    if (!linkHeader) return null;
    const links = linkHeader.split(',');
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match && match[2] === 'next') {
        return match[1];
      }
    }
    return null;
  }

  async paginate(endpoint, resourceKey, queryParams = {}, maxPages = 20) {
    const results = [];
    const searchParams = new URLSearchParams(queryParams);
    if (!searchParams.has('limit')) {
      searchParams.set('limit', '250');
    }

    let nextUrl = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${searchParams.toString()}`;
    let pageCount = 0;

    while (nextUrl && pageCount < maxPages) {
      pageCount++;
      const { data, nextUrl: next } = await this.request(nextUrl);
      const batch = (data && data[resourceKey]) || [];
      results.push(...batch);

      console.log(`[Shopify] Page ${pageCount}: Fetched ${batch.length} items (Total: ${results.length})`);
      if (batch.length === 0 || !next) break;

      nextUrl = next;
    }

    return results;
  }
}
