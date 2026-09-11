import { config } from '../config.js';
import { ShiprocketAuth } from './auth.js';

export class ShiprocketClient {
  constructor(auth = new ShiprocketAuth()) {
    this.auth = auth;
    this.baseUrl = config.shiprocket.baseUrl;
  }

  async request(endpoint, options = {}, isRetry = false) {
    const token = await this.auth.getToken(isRetry);
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && !isRetry) {
      console.warn('[Shiprocket] Token expired or invalid (401). Refreshing token and retrying...');
      return this.request(endpoint, options, true);
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shiprocket API Error (${res.status} ${res.statusText}): ${text}`);
    }

    return res.json();
  }
}
