import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';
  const themeId = '158843044032';

  const checkAsset = async (key) => {
    const url = `https://${store}/admin/api/2024-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    console.log(`Status for ${key}:`, res.status);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Not JSON', raw: text.slice(0, 200) };
    }
  };

  const indexJson = await checkAsset('templates/index.json');
  console.log('templates/index.json:', indexJson.asset ? `EXISTS (length: ${indexJson.asset.value.length})` : indexJson);
  if (indexJson.asset) {
    console.log('First 200 chars:', indexJson.asset.value.slice(0, 200));
  }
}

main().catch(console.error);
