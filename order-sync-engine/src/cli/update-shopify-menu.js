import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  // 1. Fetch current Main Menu
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
            type
            resourceId
            url
            items {
              id
              title
              type
              resourceId
              url
            }
          }
        }
      }
    }
  `;

  const res = await fetch(`https://${store}/admin/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  const menus = data.data?.menus?.nodes || [];
  const mainMenu = menus.find(m => m.handle === 'main-menu');
  if (!mainMenu) {
    console.error('Main menu not found!', data);
    return;
  }

  console.log(`Found Main Menu (${mainMenu.id}):`);
  mainMenu.items.forEach(i => console.log(`  * ${i.title} [${i.type}] -> ${i.url || i.resourceId}`));

  // 2. Prepare items for menuUpdate
  const newItems = mainMenu.items.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    resourceId: item.resourceId,
    url: item.url,
    items: (item.items || []).map(sub => ({
      id: sub.id,
      title: sub.title,
      type: sub.type,
      resourceId: sub.resourceId,
      url: sub.url
    }))
  }));

  // Check if Perfumes already present
  const hasPerfumes = newItems.some(i => i.title.toLowerCase() === 'perfumes' || i.resourceId === 'gid://shopify/Collection/482298822848');
  if (!hasPerfumes) {
    console.log('Adding "Perfumes" item...');
    newItems.push({
      title: 'Perfumes',
      type: 'COLLECTION',
      resourceId: 'gid://shopify/Collection/482298822848'
    });
  }

  // Check if Car Perfumes already present
  const hasCarPerfumes = newItems.some(i => i.title.toLowerCase().includes('car') || i.resourceId === 'gid://shopify/Collection/482298757312');
  if (!hasCarPerfumes) {
    console.log('Adding "Car Perfumes" item...');
    newItems.push({
      title: 'Car Perfumes',
      type: 'COLLECTION',
      resourceId: 'gid://shopify/Collection/482298757312'
    });
  }

  // 3. Execute menuUpdate mutation
  const updateMutation = `
    mutation menuUpdate($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
      menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
        userErrors {
          field
          message
        }
        menu {
          id
          title
          handle
          items {
            id
            title
            type
            url
            resourceId
          }
        }
      }
    }
  `;

  console.log('\nSending menuUpdate mutation...');
  const mutRes = await fetch(`https://${store}/admin/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({
      query: updateMutation,
      variables: {
        id: mainMenu.id,
        title: mainMenu.title,
        handle: mainMenu.handle,
        items: newItems
      }
    })
  });

  const mutData = await mutRes.json();
  if (mutData.data?.menuUpdate?.userErrors?.length > 0) {
    console.error('User errors:', mutData.data.menuUpdate.userErrors);
  } else if (mutData.data?.menuUpdate?.menu) {
    console.log('\n🎉 SUCCESS! Updated Main Menu:');
    mutData.data.menuUpdate.menu.items.forEach(i => {
      console.log(`  * ${i.title} (${i.type}) -> ${i.url || i.resourceId}`);
    });
  } else {
    console.error('Error updating menu:', mutData);
  }
}

main().catch(console.error);
