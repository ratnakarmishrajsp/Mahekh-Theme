import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  console.log('=== STEP 1: CURATE BEST SELLING ATTARS COLLECTION ===');
  const bestSellerColId = 482288599232;

  // Fetch current collects for best sellers
  const collectsRes = await fetch(`https://${store}/admin/api/2024-07/collects.json?collection_id=${bestSellerColId}&limit=250`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const collectsData = await collectsRes.json();
  const currentCollects = collectsData.collects || [];
  console.log(`Current items in Best Sellers: ${currentCollects.length}`);

  // IDs that SHOULD be in Best Selling Attars
  const bestSellerProductIds = [
    10251191058624, // Original Kasturi Attar (Main)
    10251182309568, // Katcha Bela + Kasturi + Rose Combo (Pack of 3)
    10251182407872, // Kesar Chandan & Kasturi Combo (Pack of 2)
    10251182047424, // Mogra Flower Attar
    10251182178496, // Rose Attar
    10251182276800, // Sandalwood Attar
    10251182145728, // Jasmine Attar
    10251181981888, // Combo Pack of 2 – Pure Kasturi Attar
    10251182014656, // Combo Pack of 4 (Kasturi + Sandalwood + Rose + Jasmine)
    10251181228224, // Mahekh Asli Rose Gold Attar (12 ML)
    10251181621440, // Mahekh Ruh Khus Attar (12 ML)
    10251181654208, // Thick Musk Tahara Attar (12 ML)
    10251181129920  // Jannat-E-Firdous Attar
  ];

  // Remove car perfumes and EDP sprays from Best Selling Attars
  const nonAttarIds = [
    10251181260992, // Chocolate EDP
    10251181293760, // Flora Bloom Car Perfume
    10251181326528, // Flora Bloom EDP
    10251181424832, // Kasturi Musk EDP
    10251181457600  // Pineapple Kick EDP
  ];

  for (const c of currentCollects) {
    if (nonAttarIds.includes(c.product_id)) {
      console.log(`Removing non-attar product ${c.product_id} from Best Sellers...`);
      await fetch(`https://${store}/admin/api/2024-07/collects/${c.id}.json`, {
        method: 'DELETE',
        headers: { 'X-Shopify-Access-Token': token }
      });
    }
  }

  // Add the curated attars to Best Sellers if not already there
  const existingProductIds = new Set(currentCollects.map(c => c.product_id));
  for (const pid of bestSellerProductIds) {
    if (!existingProductIds.has(pid)) {
      console.log(`Adding product ${pid} to Best Selling Attars...`);
      await fetch(`https://${store}/admin/api/2024-07/collects.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({
          collect: {
            collection_id: bestSellerColId,
            product_id: pid
          }
        })
      });
    }
  }

  console.log('\n=== STEP 2: CREATE / UPDATE COMBO ATTARS COLLECTION ===');
  // Check if combo collection exists
  const colRes = await fetch(`https://${store}/admin/api/2024-07/custom_collections.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const colData = await colRes.json();
  const existingCols = colData.custom_collections || [];

  let comboCol = existingCols.find(c => c.handle === 'combo-attars' || c.handle === 'combo-collection' || c.title.toLowerCase().includes('combo'));

  // Get image of Pack of 4 or Katcha Bela combo
  const comboImageRes = await fetch(`https://${store}/admin/api/2024-07/products/10251182309568.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const comboImageData = await comboImageRes.json();
  const comboImgSrc = comboImageData.product?.images?.[0]?.src;

  if (!comboCol) {
    console.log('Creating "Combo Attars" collection...');
    const createRes = await fetch(`https://${store}/admin/api/2024-07/custom_collections.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        custom_collection: {
          title: 'Combo Attars',
          handle: 'combo-attars',
          body_html: '<p>Discover Mahekh’s signature luxury Attar Combo Sets. Handcrafted, 100% pure alcohol-free perfume oil combinations available in Packs of 2, 3, and 4 for maximum value and lasting fragrance.</p>',
          published: true,
          image: comboImgSrc ? { src: comboImgSrc } : undefined
        }
      })
    });
    const createData = await createRes.json();
    comboCol = createData.custom_collection;
    console.log(`Created Combo Attars collection with ID: ${comboCol.id}`);
  } else {
    console.log(`Found existing Combo collection: "${comboCol.title}" (ID: ${comboCol.id}, handle: ${comboCol.handle})`);
  }

  // All Combo Product IDs (Packs of 2, 3, 4)
  const allComboProductIds = [
    10251191058624, // Original Kasturi Attar (Pack of 2 & 3)
    10251181981888, // ✨ Combo Pack of 2 – Pure Kasturi Attar
    10251182407872, // 👑✨ Kesar Chandan & Kasturi (Pack of 2)
    10251182473408, // 👑🌹 Kasturi & Rose (Pack of 2)
    10251182506176, // 👑🦌🌿 Kasturi & Sandalwood (Pack of 2)
    10251182080192, // ✨ Royal Sandalwood Attar Combo (Pack of 2)
    10251182309568, // 👑✨ Katcha Bela + Kasturi + Rose (Pack of 3)
    10251182440640, // 👑🌹 Jasmine, Kasturi & Rose (Pack of 3)
    10251182538944, // 👑🌙🌹 Raatrani, Kasturi & Rose (Pack of 3)
    10251182014656  // ✨ Combo Pack of 4 (Kasturi + Sandalwood + Rose + Jasmine)
  ];

  console.log(`\nAssigning ${allComboProductIds.length} combo products to collection ${comboCol.id}...`);
  for (const pid of allComboProductIds) {
    const res = await fetch(`https://${store}/admin/api/2024-07/collects.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        collect: {
          collection_id: comboCol.id,
          product_id: pid
        }
      })
    });
    const d = await res.json();
    console.log(`  - Product ${pid}:`, d.collect ? 'ADDED' : (d.errors ? 'ALREADY PRESENT' : 'DONE'));
  }

  console.log('\n=== STEP 3: UPDATE MAIN MENU IN NAVIGATION ===');
  const menuQuery = `
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
          }
        }
      }
    }
  `;

  const menuRes = await fetch(`https://${store}/admin/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({ query: menuQuery })
  });
  const menuData = await menuRes.json();
  const mainMenu = menuData.data?.menus?.nodes?.find(m => m.handle === 'main-menu');

  if (!mainMenu) {
    console.error('Main menu not found!');
    return;
  }

  // Build the clean ordered navigation menu
  const desiredMenuItems = [
    {
      title: 'Home',
      type: 'FRONTPAGE',
      url: '/'
    },
    {
      title: 'Best Selling Attars',
      type: 'COLLECTION',
      resourceId: `gid://shopify/Collection/${bestSellerColId}`
    },
    {
      title: 'Combo Attars',
      type: 'COLLECTION',
      resourceId: `gid://shopify/Collection/${comboCol.id}`
    },
    {
      title: 'Royal Attars',
      type: 'COLLECTION',
      resourceId: 'gid://shopify/Collection/482288664768'
    },
    {
      title: 'Perfumes',
      type: 'COLLECTION',
      resourceId: 'gid://shopify/Collection/482298822848'
    },
    {
      title: 'Car Perfumes',
      type: 'COLLECTION',
      resourceId: 'gid://shopify/Collection/482298757312'
    },
    {
      title: 'All Attars & Perfumes',
      type: 'COLLECTION',
      resourceId: 'gid://shopify/Collection/482288697536'
    }
  ];

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

  console.log('Sending menuUpdate mutation to set final menu order...');
  const updateRes = await fetch(`https://${store}/admin/api/2024-07/graphql.json`, {
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
        items: desiredMenuItems
      }
    })
  });

  const updateData = await updateRes.json();
  if (updateData.data?.menuUpdate?.userErrors?.length > 0) {
    console.error('Menu user errors:', updateData.data.menuUpdate.userErrors);
  } else if (updateData.data?.menuUpdate?.menu) {
    console.log('\n🎉 SUCCESS! Updated Navigation Main Menu:');
    updateData.data.menuUpdate.menu.items.forEach((i, idx) => {
      console.log(`  ${idx + 1}. ${i.title} (${i.type}) -> ${i.url || i.resourceId}`);
    });
  } else {
    console.error('Menu update error:', updateData);
  }

  console.log('\n=== VERIFICATION LINKS ===');
  console.log(`Best Selling Attars: https://mahekh.in/collections/best-selling-attars`);
  console.log(`Combo Attars:        https://mahekh.in/collections/${comboCol.handle}`);
  console.log(`Homepage:            https://mahekh.in`);
}

main().catch(console.error);
