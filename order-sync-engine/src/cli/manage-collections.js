import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  // 1. Fetch current collections
  const resCol = await fetch(`https://${store}/admin/api/2024-01/custom_collections.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const dataCol = await resCol.json();
  const existingCols = dataCol.custom_collections || [];

  console.log('Current collections:');
  existingCols.forEach(c => console.log(`- ${c.id}: "${c.title}" (handle: ${c.handle})`));

  // 2. Fetch images of products to use as collection images
  const p1Res = await fetch(`https://${store}/admin/api/2024-01/products/10251181785280.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  }); // White Mogra Car Perfume
  const p1Data = await p1Res.json();
  const carPerfumeImage = p1Data.product?.images?.[0]?.src;

  const p2Res = await fetch(`https://${store}/admin/api/2024-01/products/10251181424832.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  }); // Kasturi Musk Eau de Parfum
  const p2Data = await p2Res.json();
  const perfumeImage = p2Data.product?.images?.[0]?.src;

  // 3. Create or Update Car Perfumes collection
  let carPerfumeCol = existingCols.find(c => c.handle === 'car-perfumes' || c.title.toLowerCase().includes('car'));
  if (!carPerfumeCol) {
    console.log('\nCreating "Car Perfumes" collection...');
    const createRes = await fetch(`https://${store}/admin/api/2024-01/custom_collections.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        custom_collection: {
          title: 'Car Perfumes',
          handle: 'car-perfumes',
          body_html: '<p>Elevate every drive with Mahekh’s artisanal hanging car fresheners. Handcrafted using premium, long-lasting aroma oils to maintain a refreshing and luxurious atmosphere inside your vehicle.</p>',
          published: true,
          image: carPerfumeImage ? { src: carPerfumeImage } : undefined
        }
      })
    });
    const createData = await createRes.json();
    carPerfumeCol = createData.custom_collection;
    console.log(`Created Car Perfumes collection with ID: ${carPerfumeCol.id}`);
  } else {
    console.log(`\n"Car Perfumes" collection exists with ID: ${carPerfumeCol.id}`);
  }

  // 4. Create or Update Perfumes collection
  let perfumeCol = existingCols.find(c => c.handle === 'perfumes' || (c.title.toLowerCase() === 'perfumes' || c.title.toLowerCase() === 'luxury perfumes'));
  if (!perfumeCol) {
    console.log('\nCreating "Perfumes" collection...');
    const createRes = await fetch(`https://${store}/admin/api/2024-01/custom_collections.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        custom_collection: {
          title: 'Perfumes',
          handle: 'perfumes',
          body_html: '<p>Discover Mahekh’s signature collection of luxury Eau de Parfum sprays (50ml). Meticulously formulated with high-concentration fragrance notes for an intoxicating, all-day presence.</p>',
          published: true,
          image: perfumeImage ? { src: perfumeImage } : undefined
        }
      })
    });
    const createData = await createRes.json();
    perfumeCol = createData.custom_collection;
    console.log(`Created Perfumes collection with ID: ${perfumeCol.id}`);
  } else {
    console.log(`\n"Perfumes" collection exists with ID: ${perfumeCol.id}`);
  }

  // 5. Assign Car Perfume products to Car Perfumes collection
  const carProductIds = [
    10251181293760, // Flora Bloom
    10251181555904, // Royal Chandan
    10251181719744, // Velvet Rose
    10251181785280  // White Mogra
  ];

  console.log(`\nAssigning ${carProductIds.length} car perfumes to collection ${carPerfumeCol.id}...`);
  for (const pid of carProductIds) {
    const res = await fetch(`https://${store}/admin/api/2024-01/collects.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        collect: {
          collection_id: carPerfumeCol.id,
          product_id: pid
        }
      })
    });
    const d = await res.json();
    console.log(`  Added product ${pid}:`, d.collect ? 'OK' : (d.errors ? JSON.stringify(d.errors) : 'Done'));
  }

  // 6. Assign Eau de Parfum products to Perfumes collection
  const perfumeProductIds = [
    10251181260992, // Chocolate
    10251181326528, // Flora Bloom
    10251181424832, // Kasturi Musk
    10251181457600, // Pineapple Kick
    10251181752512, // Velvet Rose
    10251181818048  // White Mogra
  ];

  console.log(`\nAssigning ${perfumeProductIds.length} perfumes to collection ${perfumeCol.id}...`);
  for (const pid of perfumeProductIds) {
    const res = await fetch(`https://${store}/admin/api/2024-01/collects.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        collect: {
          collection_id: perfumeCol.id,
          product_id: pid
        }
      })
    });
    const d = await res.json();
    console.log(`  Added product ${pid}:`, d.collect ? 'OK' : (d.errors ? JSON.stringify(d.errors) : 'Done'));
  }

  console.log('\n=== VERIFICATION ===');
  console.log(`Car Perfumes URL: https://mahekh.in/collections/${carPerfumeCol.handle}`);
  console.log(`Perfumes URL:     https://mahekh.in/collections/${perfumeCol.handle}`);
}

main().catch(console.error);
