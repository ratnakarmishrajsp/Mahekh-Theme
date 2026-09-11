import { ShopifyClient } from '../shopify/client.js';

async function listProducts() {
  const shopify = new ShopifyClient();
  const products = await shopify.paginate('/products.json', 'products', { limit: '250' });
  console.log(`\nFound ${products.length} total products in Shopify:\n`);
  
  for (const p of products) {
    const hasHtmlDesc = p.body_html && p.body_html.includes('<style');
    const descLength = (p.body_html || '').length;
    console.log(`[ID: ${p.id}] ${p.title} | Handle: ${p.handle} | HasRichStyle: ${hasHtmlDesc} | DescLen: ${descLength}`);
  }
}

listProducts().catch(console.error);
