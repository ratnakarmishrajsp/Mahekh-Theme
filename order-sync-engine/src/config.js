import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Zero-dependency .env loader
export function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

export const config = {
  rootDir,
  dataDir: path.join(rootDir, 'data'),
  exportsDir: path.join(rootDir, 'exports'),
  shopify: {
    storeUrl: (process.env.SHOPIFY_STORE_URL || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
    clientId: process.env.SHOPIFY_CLIENT_ID || '',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
    accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-07',
  },
  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL || '',
    password: process.env.SHIPROCKET_PASSWORD || '',
    baseUrl: 'https://apiv2.shiprocket.in/v1/external',
  },
  cacheTtlMinutes: parseInt(process.env.CACHE_TTL_MINUTES || '15', 10),
};

// Ensure directories exist
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}
if (!fs.existsSync(config.exportsDir)) {
  fs.mkdirSync(config.exportsDir, { recursive: true });
}

export function validateConfig() {
  const missing = [];
  if (!config.shopify.storeUrl) missing.push('SHOPIFY_STORE_URL (e.g. yourbrand.myshopify.com)');
  if (!config.shopify.accessToken && (!config.shopify.clientId || !config.shopify.clientSecret)) {
    missing.push('SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_ACCESS_TOKEN)');
  }
  if (!config.shiprocket.email) missing.push('SHIPROCKET_EMAIL');
  if (!config.shiprocket.password) missing.push('SHIPROCKET_PASSWORD');
  return {
    valid: missing.length === 0,
    missing,
  };
}
