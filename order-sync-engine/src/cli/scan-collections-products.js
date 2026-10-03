import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  const colRes = await fetch(`https://${store}/admin/api/2024-01/custom_collections.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const colData = await colRes.json();
  const smartRes = await fetch(`https://${store}/admin/api/2024-01/smart_collections.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const smartData = await smartRes.json();

  console.log('=== CUSTOM COLLECTIONS ===');
  (colData.custom_collections || []).forEach(c => console.log(`${c.id} | ${c.title} | /collections/${c.handle}`));
  console.log('\n=== SMART COLLECTIONS ===');
  (smartData.smart_collections || []).forEach(c => console.log(`${c.id} | ${c.title} | /collections/${c.handle}`));

  let allProducts = [];
  let url = `https://${store}/admin/api/2024-01/products.json?limit=250`;
  while (url) {
    const pRes = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    const pData = await pRes.json();
    allProducts = allProducts.concat(pData.products || []);
    const linkHeader = pRes.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      url = match ? match[1] : null;
    } else {
      url = null;
    }
  }

  console.log(`\n=== TOTAL PRODUCTS: ${allProducts.length} ===`);
  const carPerfumes = [];
  const regularPerfumes = [];
  const attars = [];
  const others = [];

  allProducts.forEach(p => {
    const titleLower = p.title.toLowerCase();
    const typeLower = (p.product_type || '').toLowerCase();
    const tagsLower = (p.tags || '').toLowerCase();

    if (titleLower.includes('car') || tagsLower.includes('car') || typeLower.includes('car')) {
      carPerfumes.push(p);
    } else if (titleLower.includes('perfume') || tagsLower.includes('perfume') || typeLower.includes('perfume')) {
      regularPerfumes.push(p);
    } else if (titleLower.includes('attar') || tagsLower.includes('attar') || typeLower.includes('attar')) {
      attars.push(p);
    } else {
      others.push(p);
    }
  });

  console.log(`\n--- CAR PERFUMES (${carPerfumes.length}) ---`);
  carPerfumes.forEach(p => console.log(`  - [ID: ${p.id}] ${p.title} (handle: ${p.handle})`));

  console.log(`\n--- PERFUMES (${regularPerfumes.length}) ---`);
  regularPerfumes.forEach(p => console.log(`  - [ID: ${p.id}] ${p.title} (handle: ${p.handle})`));

  console.log(`\n--- ATTARS (${attars.length}) ---`);
  attars.forEach(p => console.log(`  - [ID: ${p.id}] ${p.title} (handle: ${p.handle})`));

  console.log(`\n--- OTHERS (${others.length}) ---`);
  others.forEach(p => console.log(`  - [ID: ${p.id}] ${p.title} (handle: ${p.handle})`));
}

main().catch(console.error);
