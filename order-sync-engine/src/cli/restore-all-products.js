import fs from 'node:fs';
import path from 'node:path';
import { ShopifyClient } from '../shopify/client.js';
import { config } from '../config.js';

const workspaceRoot = 'c:\\Users\\Ratnakar\\Desktop\\Mahekh theme';
const descriptionsDir = path.join(workspaceRoot, 'descriptions');
const pendingProductsPath = path.join(config.dataDir, 'pending_products.json');

async function restoreAllProducts() {
  console.log(`\n======================================================`);
  console.log(`Starting Full Product Restore to ${config.shopify.storeUrl}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(pendingProductsPath)) {
    throw new Error(`pending_products.json not found at: ${pendingProductsPath}`);
  }

  const raw = fs.readFileSync(pendingProductsPath, 'utf8');
  const backupProducts = JSON.parse(raw);
  console.log(`Loaded ${backupProducts.length} products from backup repository.\n`);

  const shopify = new ShopifyClient();

  // 1. Fetch any existing products in the new store
  console.log(`Checking existing products in store...`);
  let existingProducts = [];
  try {
    existingProducts = await shopify.paginate('/products.json', 'products', { limit: '250' });
    console.log(`Found ${existingProducts.length} existing products in target store.`);
  } catch (err) {
    console.warn(`Could not list existing products (${err.message}). Proceeding directly...`);
  }

  const existingByHandle = new Map();
  for (const p of existingProducts) {
    if (p.handle) existingByHandle.set(p.handle, p);
  }

  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < backupProducts.length; i++) {
    const item = backupProducts[i];
    const handle = item.handle;

    // Check if rich HTML description file exists in descriptions/ folder
    let bodyHtml = item.body_html || '';
    const descFilePath = path.join(descriptionsDir, `${handle}.html`);
    if (fs.existsSync(descFilePath)) {
      bodyHtml = fs.readFileSync(descFilePath, 'utf8');
    }

    // Format clean variants without legacy IDs
    const cleanVariants = (item.variants || []).map((v) => ({
      title: v.title || 'Default Title',
      price: v.price,
      compare_at_price: v.compare_at_price || null,
      sku: v.sku || '',
      barcode: v.barcode || '',
      requires_shipping: v.requires_shipping !== false,
      taxable: false,
      option1: v.option1 || 'Default Title',
      option2: v.option2 || null,
      option3: v.option3 || null,
    }));

    // Format clean images
    const cleanImages = (item.images || []).map((img) => ({
      src: img.src,
      alt: img.alt || item.title,
    }));

    const existing = existingByHandle.get(handle);

    if (existing) {
      console.log(`[${i + 1}/${backupProducts.length}] Updating existing product: ${item.title} (ID: ${existing.id})`);
      try {
        await shopify.request(`/products/${existing.id}.json`, {
          method: 'PUT',
          body: JSON.stringify({
            product: {
              id: existing.id,
              body_html: bodyHtml,
              tags: item.tags || '',
              vendor: item.vendor || 'Mahekh Fragrances',
            },
          }),
        });
        updatedCount++;
        console.log(`   ✔ Updated successfully!\n`);
      } catch (err) {
        failedCount++;
        console.error(`   ✖ Failed to update: ${err.message}\n`);
      }
    } else {
      console.log(`[${i + 1}/${backupProducts.length}] Creating product: ${item.title}`);
      console.log(`   Handle: ${handle} | Variants: ${cleanVariants.length} | Images: ${cleanImages.length}`);

      const productPayload = {
        title: item.title,
        handle: handle,
        body_html: bodyHtml,
        vendor: item.vendor || 'Mahekh Fragrances',
        product_type: item.product_type || 'Attar & Perfumes',
        tags: item.tags || '',
        published: true,
        status: 'active',
        variants: cleanVariants.length > 0 ? cleanVariants : [{ price: '699.00', title: 'Default' }],
      };

      if (cleanImages.length > 0) {
        productPayload.images = cleanImages;
      }

      try {
        const res = await shopify.request('/products.json', {
          method: 'POST',
          body: JSON.stringify({ product: productPayload }),
        });
        const created = res.data && res.data.product;
        createdCount++;
        console.log(`   ✔ Created successfully! New ID: ${created ? created.id : 'OK'}\n`);
      } catch (err) {
        failedCount++;
        console.error(`   ✖ Failed to create: ${err.message}\n`);
      }
    }

    // Rate-limiting delay to respect Shopify API limits
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  console.log(`\n================ RESTORE SUMMARY ================`);
  console.log(`Store: ${config.shopify.storeUrl}`);
  console.log(`Total Processed: ${backupProducts.length}`);
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`=================================================\n`);
}

restoreAllProducts().catch(console.error);
