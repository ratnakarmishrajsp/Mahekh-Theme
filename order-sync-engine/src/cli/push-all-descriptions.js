import fs from 'node:fs';
import path from 'node:path';
import { ShopifyClient } from '../shopify/client.js';
import { productsMetadata } from '../intelligence/product-metadata.js';

const workspaceRoot = 'c:\\Users\\Ratnakar\\Desktop\\Mahekh theme';
const descriptionsDir = path.join(workspaceRoot, 'descriptions');

async function pushAllDescriptions() {
  console.log(`\n======================================================`);
  console.log(`Starting Batch Shopify Update for ${productsMetadata.length} Products`);
  console.log(`======================================================\n`);

  const shopify = new ShopifyClient();
  let updatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < productsMetadata.length; i++) {
    const item = productsMetadata[i];
    const filePath = path.join(descriptionsDir, `${item.handle}.html`);

    if (!fs.existsSync(filePath)) {
      console.error(`[${i + 1}/${productsMetadata.length}] ✖ File not found: ${filePath}`);
      failedCount++;
      continue;
    }

    const htmlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`[${i + 1}/${productsMetadata.length}] Updating ID ${item.id}: ${item.displayTitle.replace(/<[^>]+>/g, '')}`);
    console.log(`   Handle: ${item.handle} | Size: ${htmlContent.length} bytes`);

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
      updatedCount++;
      console.log(`   ✔ Successfully pushed! Updated At: ${updated ? updated.updated_at : 'OK'}`);
      console.log(`   Live: https://mahekh.in/products/${item.handle}\n`);
    } catch (err) {
      failedCount++;
      console.error(`   ✖ Failed: ${err.message}\n`);
    }

    // Rate-limiting delay: 600ms between calls
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  console.log(`\n================ BATCH FINISHED ================`);
  console.log(`Successfully Updated: ${updatedCount}/${productsMetadata.length}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`================================================\n`);
}

pushAllDescriptions().catch(console.error);
