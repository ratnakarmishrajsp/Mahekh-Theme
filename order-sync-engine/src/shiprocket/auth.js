import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export class ShiprocketAuth {
  constructor() {
    this.tokenFilePath = path.join(config.dataDir, 'sr_token.json');
  }

  getCachedToken() {
    try {
      if (fs.existsSync(this.tokenFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.tokenFilePath, 'utf8'));
        const expiresAt = new Date(data.expires_at).getTime();
        // Return if at least 1 hour remains
        if (expiresAt - Date.now() > 3600000) {
          return data.token;
        }
      }
    } catch {
      // Ignore cache read errors
    }
    return null;
  }

  saveToken(token) {
    try {
      const payload = {
        token,
        cached_at: new Date().toISOString(),
        // Valid for 9 days (Shiprocket gives ~10 days)
        expires_at: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      };
      fs.writeFileSync(this.tokenFilePath, JSON.stringify(payload, null, 2));
    } catch (err) {
      console.warn(`[Shiprocket] Could not cache auth token: ${err.message}`);
    }
  }

  async getToken(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = this.getCachedToken();
      if (cached) return cached;
    }

    if (!config.shiprocket.email || !config.shiprocket.password) {
      throw new Error('Shiprocket credentials missing. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env');
    }

    console.log(`[Shiprocket] Authenticating via ${config.shiprocket.baseUrl}/auth/login...`);
    const res = await fetch(`${config.shiprocket.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: config.shiprocket.email,
        password: config.shiprocket.password,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Shiprocket Auth Failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error(`Shiprocket Auth Failed: No token returned. Response: ${JSON.stringify(data)}`);
    }

    this.saveToken(data.token);
    console.log(`[Shiprocket] Authentication successful. JWT token cached.`);
    return data.token;
  }
}
