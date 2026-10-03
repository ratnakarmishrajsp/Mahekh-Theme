import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';
  const themeId = '158843044032';

  const res = await fetch(`https://${store}/admin/api/2024-01/themes/${themeId}/assets.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  const remoteKeys = new Set(data.assets.map(a => a.key));

  const localSections = fs.readdirSync('sections').filter(f => f.endsWith('.liquid'));
  const missing = [];
  const present = [];

  for (const f of localSections) {
    const key = `sections/${f}`;
    if (!remoteKeys.has(key)) {
      missing.push(key);
    } else {
      present.push(key);
    }
  }

  console.log(`Total local sections: ${localSections.length}`);
  console.log(`Present on Shopify: ${present.length}`);
  console.log(`MISSING on Shopify: ${missing.length}`);
  console.log('Missing sections:', missing);

  // Also check snippets
  const localSnippets = fs.readdirSync('snippets').filter(f => f.endsWith('.liquid'));
  const missingSnippets = [];
  for (const f of localSnippets) {
    const key = `snippets/${f}`;
    if (!remoteKeys.has(key)) {
      missingSnippets.push(key);
    }
  }
  console.log(`Missing snippets on Shopify: ${missingSnippets.length}`, missingSnippets);
}

main().catch(console.error);
