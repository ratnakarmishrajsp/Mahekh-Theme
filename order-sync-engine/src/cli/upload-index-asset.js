import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';
  const themeId = '158843044032';

  let indexContent = fs.readFileSync('templates/index.json', 'utf8');
  const cleanJson = indexContent.replace(/\/\*[\s\S]*?\*\//g, '').trim();

  console.log('Validating local JSON...');
  const parsed = JSON.parse(cleanJson);
  indexContent = cleanJson;
  console.log('Local JSON valid. Sections count:', Object.keys(parsed.sections).length);
  console.log('Order:', parsed.order);

  console.log('Uploading templates/index.json to Shopify theme...');
  const res = await fetch(`https://${store}/admin/api/2024-01/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({
      asset: {
        key: 'templates/index.json',
        value: indexContent
      }
    })
  });

  const status = res.status;
  const data = await res.json();
  console.log(`Response status: ${status}`);
  console.log('Response body:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
