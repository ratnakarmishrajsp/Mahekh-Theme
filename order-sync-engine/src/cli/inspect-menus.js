import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  const query = `
    query {
      menus(first: 10) {
        nodes {
          id
          title
          handle
          items {
            id
            title
            url
            type
            items {
              id
              title
              url
            }
          }
        }
      }
    }
  `;

  const res = await fetch(`https://${store}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
