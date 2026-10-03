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
  if (data.errors) {
    console.error('API Error:', JSON.stringify(data.errors, null, 2));
    if (JSON.stringify(data.errors).includes('ACCESS_DENIED') || JSON.stringify(data.errors).includes('menus')) {
      console.log('\n[SCOPE REQUIRED]: The app needs "read_online_store_navigation" and "write_online_store_navigation" permissions.');
    }
    return;
  }

  const menus = data.data?.menus?.nodes || [];
  console.log('Available menus:', menus.map(m => ({ id: m.id, title: m.title, handle: m.handle })));

  const mainMenu = menus.find(m => m.handle === 'main-menu') || menus[0];
  if (!mainMenu) {
    console.error('Main menu not found');
    return;
  }

  console.log(`\nFound Main Menu (${mainMenu.id}):`);
  mainMenu.items.forEach(item => console.log(`  - ${item.title} (${item.url})`));

  // Check if Car Perfumes and Perfumes are already in the menu
  const hasCarPerfumes = mainMenu.items.some(i => i.title.toLowerCase().includes('car') || i.url?.includes('car-perfumes'));
  const hasPerfumes = mainMenu.items.some(i => (i.title.toLowerCase() === 'perfumes' || i.title.toLowerCase() === 'luxury perfumes') || i.url?.includes('/collections/perfumes'));

  console.log('\nHas Car Perfumes:', hasCarPerfumes);
  console.log('Has Perfumes:', hasPerfumes);

  // Helper to add menu item
  async function addMenuItem(title, url) {
    console.log(`Adding "${title}" (${url}) to menu ${mainMenu.id}...`);
    const mutation = `
      mutation menuItemCreate($menuId: ID!, $item: MenuItemCreateInput!) {
        menuItemCreate(menuId: $menuId, item: $item) {
          userErrors {
            field
            message
          }
          menuItem {
            id
            title
            url
          }
        }
      }
    `;

    const mutRes = await fetch(`https://${store}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          menuId: mainMenu.id,
          item: {
            title,
            url
          }
        }
      })
    });

    const mutData = await mutRes.json();
    console.log('Result:', JSON.stringify(mutData, null, 2));
  }

  if (!hasPerfumes) {
    await addMenuItem('Perfumes', '/collections/perfumes');
  }
  if (!hasCarPerfumes) {
    await addMenuItem('Car Perfumes', '/collections/car-perfumes');
  }

  console.log('\nMenu update process completed.');
}

main().catch(console.error);
