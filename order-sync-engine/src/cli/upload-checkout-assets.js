import fs from 'fs';

async function upload(key) {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';
  const themeId = '158843044032';
  const val = fs.readFileSync(key, 'utf8');
  const res = await fetch(`https://${store}/admin/api/2024-01/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ asset: { key, value: val } })
  });
  const data = await res.json();
  console.log(`Uploaded ${key}: status ${res.status}`, data?.asset?.key || data);
}

async function run() {
  await upload('snippets/sr-checkout.liquid');
  await upload('snippets/cart-drawer.liquid');
  await upload('sections/main-cart-footer.liquid');
  await upload('snippets/buy-buttons.liquid');
}

run().catch(console.error);
