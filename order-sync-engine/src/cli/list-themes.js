import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  const res = await fetch(`https://${store}/admin/api/2024-01/themes.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  console.log('Themes on store:', JSON.stringify(data.themes, null, 2));

  // Find the published/main theme
  const mainTheme = data.themes.find(t => t.role === 'main');
  console.log('Main theme:', mainTheme);

  // List all assets in main theme
  const assetsRes = await fetch(`https://${store}/admin/api/2024-01/themes/${mainTheme.id}/assets.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const assetsData = await assetsRes.json();
  console.log('Total assets in main theme:', assetsData.assets ? assetsData.assets.length : 0);
  if (assetsData.assets) {
    const templates = assetsData.assets.filter(a => a.key.startsWith('templates/'));
    console.log('Templates in main theme:');
    templates.forEach(t => console.log('  -', t.key));
  }
}

main().catch(console.error);
