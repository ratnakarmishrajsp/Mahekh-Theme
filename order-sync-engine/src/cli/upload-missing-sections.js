import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';
  const themeId = '158843044032';

  const files = [
    'sections/custom-heritage.liquid',
    'sections/product-making-process.liquid'
  ];

  for (const file of files) {
    console.log(`Uploading ${file}...`);
    const content = fs.readFileSync(file, 'utf8');
    const res = await fetch(`https://${store}/admin/api/2024-01/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        asset: {
          key: file,
          value: content
        }
      })
    });
    const status = res.status;
    const data = await res.json();
    console.log(`Status ${status} for ${file}:`, JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
