import { ShopifyClient } from '../shopify/client.js';

async function scanAllProducts() {
  const shopify = new ShopifyClient();
  const products = await shopify.paginate('/products.json', 'products', { limit: '250' });
  
  const alreadyStyledIds = new Set([
    7938439839822, // Original Kasturi Attar
    7938207318094, // Premium Attar Trio
    7987284607054, // Mahekh Luxury Floral Trio
    7987267436622, // Mahekh Signature Jasmin Mogra Ratrani Trio
    7942277070926, // Kesar Chandan, Kasturi & Rose Pack of 3
    7928019288142, // Mahekh Black Musk Attar
    7928019320910, // Mahekh Black Oud Attar
    7928019484750, // Mahekh White Oud Attar
    7938439479374, // Imperial White Oud Attar
    7938439544910, // Obsidian Black Oud Attar
  ]);

  const pending = [];
  const completed = [];

  for (const p of products) {
    const isStyled = alreadyStyledIds.has(p.id) || (p.body_html && p.body_html.includes('mh-') && p.body_html.length > 8000);
    const item = {
      id: p.id,
      title: p.title,
      handle: p.handle,
      price: p.variants?.[0]?.price || '',
      imagesCount: p.images?.length || 0,
      descLength: (p.body_html || '').length,
      isStyled: isStyled,
      firstImage: p.images?.[0]?.src || '',
    };

    if (isStyled) {
      completed.push(item);
    } else {
      pending.push(item);
    }
  }

  console.log(`\n================ SCAN REPORT ================`);
  console.log(`Total Products in Store: ${products.length}`);
  console.log(`Already Styled / Locked: ${completed.length}`);
  console.log(`Pending Products to Style: ${pending.length}`);
  console.log(`=============================================\n`);

  console.log('--- COMPLETED / LOCKED PRODUCTS ---');
  completed.forEach((p, idx) => {
    console.log(`${idx + 1}. [ID: ${p.id}] ${p.title} (len: ${p.descLength})`);
  });

  console.log('\n--- PENDING PRODUCTS TO STYLE ---');
  pending.forEach((p, idx) => {
    console.log(`${idx + 1}. [ID: ${p.id}] ${p.title} (Handle: ${p.handle}) (Len: ${p.descLength})`);
  });
}

scanAllProducts().catch(console.error);
