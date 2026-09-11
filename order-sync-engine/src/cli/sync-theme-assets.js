import fs from 'node:fs';
import path from 'node:path';
import { ShopifyClient } from '../shopify/client.js';

const workspaceRoot = 'c:\\Users\\Ratnakar\\Desktop\\Mahekh theme';
const themeId = 151435608142; // Mahekh-Theme/main

const filesToSync = [
  'snippets/pincode-checker.liquid',
  'sections/main-product.liquid',
  'sections/frequently-bought-together.liquid',
  'templates/product.json',
  'snippets/cart-drawer.liquid',
  'sections/main-track-order.liquid',
  'templates/page.track-order.json',
];

async function syncThemeAssets() {
  console.log(`\nStarting direct Asset API sync to Theme ${themeId} (${filesToSync.length} files)...\n`);
  const shopify = new ShopifyClient();

  for (const relPath of filesToSync) {
    const fullPath = path.join(workspaceRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`[ERROR] File not found: ${fullPath}`);
      continue;
    }

    const key = relPath.replace(/\\/g, '/');
    const content = fs.readFileSync(fullPath, 'utf8');

    console.log(`[Uploading] ${key} (${content.length} bytes)...`);

    try {
      const res = await shopify.request(`/themes/${themeId}/assets.json`, {
        method: 'PUT',
        body: JSON.stringify({
          asset: {
            key: key,
            value: content,
          },
        }),
      });

      console.log(`  ✔ Successfully synced ${key}! Updated At: ${res.data?.asset?.updated_at || 'OK'}`);
    } catch (err) {
      console.error(`  ✖ Failed to upload ${key}: ${err.message}`);
    }
  }

  console.log('\nAsset API sync complete!\n');
}

syncThemeAssets().catch(console.error);
