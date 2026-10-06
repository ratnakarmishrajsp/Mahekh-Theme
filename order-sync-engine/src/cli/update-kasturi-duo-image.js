import fs from 'fs';
import path from 'path';
import { ShopifyClient } from './src/shopify/client.js';

async function updateProductImage() {
  const client = new ShopifyClient();
  const token = await client.getAccessToken();
  const store = client.storeUrl;
  const productId = '10251191058624';

  console.log('1. Reading new image file...');
  const imagePath = path.resolve('../assets/mahekh-kasturi-duo-pack-of-2.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  console.log(`Image size: ${imageBuffer.length} bytes`);

  console.log('2. Fetching current product data...');
  const { data: initialData } = await client.request(`/products/${productId}.json`);
  const currentImages = initialData.product.images;
  console.log('Current images:');
  currentImages.forEach(img => console.log(`  - [${img.id}] pos: ${img.position}, src: ${img.src}`));

  const variant2Pack = initialData.product.variants.find(v => v.title.includes('Pack of 2') || v.option1.includes('Pack of 2'));
  console.log(`Pack of 2 variant ID: ${variant2Pack?.id}`);

  console.log('3. Uploading new image to product...');
  const uploadPayload = {
    image: {
      attachment: base64Image,
      filename: 'mahekh_kasturi_duo_pack_of_2.jpg',
      position: 1,
      alt: 'Mahekh Kasturi Duo - Pack of 2'
    }
  };

  const uploadRes = await fetch(`https://${store}/admin/api/${client.apiVersion}/products/${productId}/images.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify(uploadPayload)
  });

  const uploadData = await uploadRes.json();
  if (!uploadData.image) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  }
  const newImageId = uploadData.image.id;
  console.log(`New image uploaded successfully with ID: ${newImageId}`);

  console.log('4. Assigning new image to Pack of 2 variant...');
  if (variant2Pack) {
    const variantRes = await fetch(`https://${store}/admin/api/${client.apiVersion}/variants/${variant2Pack.id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        variant: {
          id: variant2Pack.id,
          image_id: newImageId
        }
      })
    });
    const variantData = await variantRes.json();
    console.log('Variant updated with new image ID:', variantData.variant?.image_id);
  }

  console.log('5. Removing old combo/bogo image...');
  // The old image is the one at position 1 previously: 59670952280256
  const oldImage = currentImages.find(img => img.id === 59670952280256 || img.src.includes('buy_one_get_one_free'));
  if (oldImage) {
    console.log(`Deleting old image ID: ${oldImage.id}...`);
    const delRes = await fetch(`https://${store}/admin/api/${client.apiVersion}/products/${productId}/images/${oldImage.id}.json`, {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': token
      }
    });
    console.log(`Delete status: ${delRes.status} ${delRes.statusText}`);
  }

  console.log('6. Verifying final product state...');
  const { data: finalData } = await client.request(`/products/${productId}.json`);
  console.log('Final images:');
  finalData.product.images.forEach(img => console.log(`  - [${img.id}] pos: ${img.position}, src: ${img.src}`));
  console.log('Final variants:');
  finalData.product.variants.forEach(v => console.log(`  - [${v.id}] ${v.title}, image_id: ${v.image_id}, price: Rs. ${v.price}`));
}

updateProductImage().catch(console.error);
