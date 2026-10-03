import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';
  const productId = '10251191058624';

  const getRes = await fetch('https://' + store + '/admin/api/2024-01/products/' + productId + '.json', {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const getData = await getRes.json();
  const product = getData.product;

  const updatePayload = {
    product: {
      id: productId,
      options: [
        {
          id: product.options[0].id,
          name: 'Pack',
          values: ['Pack of 2 (Buy 1 Get 1 Free)', 'Pack of 3']
        }
      ],
      variants: [
        {
          id: product.variants[0].id,
          option1: 'Pack of 2 (Buy 1 Get 1 Free)',
          price: '999.00',
          compare_at_price: '1999.00',
          sku: 'MH-KASTURI-P2-BOGO',
          inventory_policy: 'continue',
          requires_shipping: true
        },
        {
          id: product.variants[1].id,
          option1: 'Pack of 3',
          price: '1299.00',
          compare_at_price: '2499.00',
          sku: 'MH-KASTURI-P3',
          inventory_policy: 'continue',
          requires_shipping: true
        }
      ]
    }
  };

  const putRes = await fetch('https://' + store + '/admin/api/2024-01/products/' + productId + '.json', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify(updatePayload)
  });
  const putData = await putRes.json();
  if (putData.product) {
    console.log('SUCCESS! Updated variants:');
    putData.product.variants.forEach(v => {
      console.log('  *', v.title, '— Rs.', v.price, '(Compare at: Rs.', v.compare_at_price + ')');
    });
  } else {
    console.error('Update failed:', putData);
  }
}

main().catch(console.error);
