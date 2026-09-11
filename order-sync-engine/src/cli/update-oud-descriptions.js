import fs from 'node:fs';
import path from 'node:path';
import { ShopifyClient } from '../shopify/client.js';

const workspaceRoot = 'c:\\Users\\Ratnakar\\Desktop\\Mahekh theme';

const productsToUpdate = [
  {
    id: 7928019320910,
    title: 'Mahekh Black Oud Attar – Premium Long Lasting Perfume Oil (12 ML)',
    file: path.join(workspaceRoot, 'mahekh-black-oud-description.html'),
  },
  {
    id: 7928019484750,
    title: 'Mahekh White Oud Attar – Premium Luxury Perfume Oil (12 ML)',
    file: path.join(workspaceRoot, 'mahekh-white-oud-description.html'),
  },
  {
    id: 7938439479374,
    title: 'Imperial White Oud Attar',
    file: path.join(workspaceRoot, 'imperial-white-oud-description.html'),
  },
  {
    id: 7938439544910,
    title: 'Obsidian Black Oud Attar',
    file: path.join(workspaceRoot, 'obsidian-black-oud-description.html'),
  },
];

async function updateDescriptions() {
  console.log(`\nStarting direct Shopify update for Royal Oud Collection (${productsToUpdate.length} products)...\n`);
  const shopify = new ShopifyClient();

  for (const item of productsToUpdate) {
    if (!fs.existsSync(item.file)) {
      console.error(`[ERROR] File not found: ${item.file}`);
      continue;
    }

    const htmlContent = fs.readFileSync(item.file, 'utf8');
    console.log(`[Updating] ID ${item.id}: ${item.title}`);
    console.log(`  Source file: ${path.basename(item.file)} (${htmlContent.length} bytes)`);

    try {
      const response = await shopify.request(`/products/${item.id}.json`, {
        method: 'PUT',
        body: JSON.stringify({
          product: {
            id: item.id,
            body_html: htmlContent,
          },
        }),
      });

      const updated = response.data && response.data.product;
      console.log(`  ✔ Successfully updated! Updated At: ${updated ? updated.updated_at : 'OK'}`);
      console.log(`  Live URL: https://mahekh.in/products/${updated.handle}\n`);
    } catch (err) {
      console.error(`  ✖ Failed to update ID ${item.id}: ${err.message}\n`);
    }
  }

  console.log('All updates finished!\n');
}

updateDescriptions().catch(console.error);
