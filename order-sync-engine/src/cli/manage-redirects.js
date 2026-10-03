import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  const res = await fetch(`https://${store}/admin/api/2024-01/redirects.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  console.log('Redirects status:', res.status);
  const data = await res.json();
  console.log('Existing redirects:', data);

  // If status is 200, let's create a clean redirect:
  if (res.status === 200) {
    const cleanPaths = [
      {
        path: '/products/combo-pack-of-2-pure-kasturi-attar',
        target: '/products/✨-combo-pack-of-2-pure-kasturi-attar-72-hour-long-lasting-alcohol-free-🔥'
      },
      {
        path: '/products/kasturi-pack-of-2',
        target: '/products/✨-combo-pack-of-2-pure-kasturi-attar-72-hour-long-lasting-alcohol-free-🔥'
      },
      {
        path: '/products/kasturi-attar-pack-of-2',
        target: '/products/✨-combo-pack-of-2-pure-kasturi-attar-72-hour-long-lasting-alcohol-free-🔥'
      }
    ];

    for (const r of cleanPaths) {
      const createRes = await fetch(`https://${store}/admin/api/2024-01/redirects.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({
          redirect: r
        })
      });
      const resData = await createRes.json();
      console.log(`Created redirect ${r.path} -> ${r.target}:`, resData);
    }
  }
}

main().catch(console.error);
