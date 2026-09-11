import fs from 'node:fs';
import path from 'node:path';
import { ShopifyClient } from '../shopify/client.js';

async function dumpPendingProducts() {
  const shopify = new ShopifyClient();
  const products = await shopify.paginate('/products.json', 'products', { limit: '250' });

  const alreadyStyledIds = new Set([
    7938439839822, // Original Kasturi Attar
    7938207318094, // Premium Attar Trio
    7987284607054, // Mahekh Luxury Floral Trio
    7987267436622, // Mahekh Signature Jasmin Mogra Ratrani Trio
    7942277070926, // Kesar Chandan, Kasturi & Rose Pack of 3
    7938439872590, // First Rain Attar
    7928019288142, // Mahekh Black Musk Attar
    7928019320910, // Mahekh Black Oud Attar
    7928019484750, // Mahekh White Oud Attar
    7938439479374, // Imperial White Oud Attar
    7938439544910, // Obsidian Black Oud Attar
  ]);

  const pending = products.filter(p => !alreadyStyledIds.has(p.id));
  console.log(`Found ${pending.length} pending products.`);

  const outputPath = path.join('c:\\Users\\Ratnakar\\Desktop\\Mahekh theme\\order-sync-engine\\data', 'pending_products.json');
  fs.writeFileSync(outputPath, JSON.stringify(pending, null, 2));
  console.log(`Saved detailed product data to ${outputPath}`);
}

dumpPendingProducts().catch(console.error);
