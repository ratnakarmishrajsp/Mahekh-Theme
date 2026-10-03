import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  const res = await fetch(`https://${store}/admin/api/2024-01/products.json?limit=250`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  const p = data.products.find(x => x.title.includes('Combo Pack of 2 – Pure Kasturi Attar'));
  
  if (!p) {
    console.log('Product not found!');
    return;
  }

  console.log('Product ID:', p.id);
  console.log('Product Title:', p.title);
  console.log('Product Handle:', p.handle);
  console.log('Variants:', p.variants.map(v => ({ title: v.title, price: v.price })));
  console.log('Direct Link:', `https://mahekh.in/products/${p.handle}`);

  // Test fetching this product page on live site
  const pageRes = await fetch(`https://mahekh.in/products/${encodeURIComponent(p.handle)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log('Live HTTP status:', pageRes.status);
}

main().catch(console.error);
