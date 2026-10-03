import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  const descriptionHtml = fs.readFileSync('mahekh-kasturi-attar-description.html', 'utf8');

  const productPayload = {
    product: {
      title: 'Original Kasturi Attar – Long-Lasting & Exotic Musk Fragrance',
      handle: 'mahekh-kasturi-attar-long-lasting-exotic-musk-fragrance',
      body_html: descriptionHtml,
      vendor: 'Mahekh',
      product_type: 'Attar',
      tags: 'Attar, Best Seller, Exotic Musk, Kasturi, Long Lasting, Pure Attar, Royal, BOGO',
      published: true,
      options: [
        {
          name: 'Pack',
          values: ['Pack of 2 (Buy 1 Get 1 Free)', 'Pack of 3']
        }
      ],
      variants: [
        {
          option1: 'Pack of 2 (Buy 1 Get 1 Free)',
          price: '999.00',
          compare_at_price: '1999.00',
          sku: 'MH-KASTURI-P2-BOGO',
          inventory_management: 'shopify',
          inventory_policy: 'continue',
          requires_shipping: true
        },
        {
          option1: 'Pack of 3',
          price: '1299.00',
          compare_at_price: '2499.00',
          sku: 'MH-KASTURI-P3',
          inventory_management: 'shopify',
          inventory_policy: 'continue',
          requires_shipping: true
        }
      ],
      images: [
        {
          src: 'https://cdn.shopify.com/s/files/1/0785/2716/8704/files/rn-image_picker_lib_temp_1a1581c5-a902-4a6a-8ba8-2ef3cc71c9b6.png?v=1791036713'
        },
        {
          src: 'https://cdn.shopify.com/s/files/1/0785/2716/8704/files/GoldElegantPremiumPerfumeInstagramPost_2.png?v=1791036713'
        },
        {
          src: 'https://cdn.shopify.com/s/files/1/0785/2716/8704/files/CopyofRedandGoldLuxuriousChristmasPerfumePromotionalInstagramPost.jpg?v=1791036713'
        }
      ]
    }
  };

  console.log('Checking if product already exists...');
  const checkRes = await fetch(`https://${store}/admin/api/2024-01/products.json?handle=mahekh-kasturi-attar-long-lasting-exotic-musk-fragrance`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const checkData = await checkRes.json();
  let productId;

  if (checkData.products && checkData.products.length > 0) {
    productId = checkData.products[0].id;
    console.log(`Product already exists with ID: ${productId}. Updating...`);
    const updateRes = await fetch(`https://${store}/admin/api/2024-01/products/${productId}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify(productPayload)
    });
    const updateData = await updateRes.json();
    console.log('Update result:', updateData.product ? 'SUCCESS' : updateData);
  } else {
    console.log('Creating new product on Shopify...');
    const createRes = await fetch(`https://${store}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify(productPayload)
    });
    const createData = await createRes.json();
    if (createData.product) {
      productId = createData.product.id;
      console.log(`Created product with ID: ${productId}`);
    } else {
      console.error('Failed to create product:', createData);
      return;
    }
  }

  // Add product to collections
  const collections = [482288599232, 482288664768, 482288697536];
  for (const collId of collections) {
    console.log(`Adding product to collection ${collId}...`);
    await fetch(`https://${store}/admin/api/2024-01/collects.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        collect: {
          product_id: productId,
          collection_id: collId
        }
      })
    });
  }

  console.log('\n--- VERIFICATION ---');
  console.log(`URL: https://mahekh.in/products/mahekh-kasturi-attar-long-lasting-exotic-musk-fragrance`);
}

main().catch(console.error);
