import fs from 'fs';

async function main() {
  const token = JSON.parse(fs.readFileSync('order-sync-engine/data/shopify_token.json')).access_token;
  const store = 'ju1pns-qf.myshopify.com';

  const res = await fetch(`https://${store}/admin/api/2024-01/pages.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  const existingPages = data.pages || [];
  console.log(`Existing pages count: ${existingPages.length}`);
  existingPages.forEach(p => console.log(`  - ${p.title} (handle: ${p.handle}, template: ${p.template_suffix})`));

  const pagesToEnsure = [
    {
      title: 'Track Order',
      handle: 'track-order',
      template_suffix: 'track-order',
      body_html: '<p>Track your Mahekh Kannauj artisan fragrance order live.</p>'
    },
    {
      title: 'Customer Intelligence',
      handle: 'customer-intelligence',
      template_suffix: 'customer-intelligence',
      body_html: '<p>Customer insights and intelligence dashboard.</p>'
    },
    {
      title: 'Heritage & Craftsmanship',
      handle: 'heritage-process',
      template_suffix: 'heritage-process',
      body_html: '<p>Discover the centuries-old Deg-Bhapka hydro-distillation art of Kannauj.</p>'
    },
    {
      title: 'ROAS Cockpit',
      handle: 'roas-cockpit',
      template_suffix: 'roas-cockpit',
      body_html: '<p>Live ROAS and performance cockpit.</p>'
    },
    {
      title: 'Contact Us',
      handle: 'contact',
      template_suffix: 'contact',
      body_html: '<p>Get in touch with the Mahekh Concierge for inquiries and custom attars.</p>'
    }
  ];

  for (const pageDef of pagesToEnsure) {
    const existing = existingPages.find(p => p.handle === pageDef.handle);
    if (existing) {
      console.log(`Page "${pageDef.title}" already exists (ID: ${existing.id}, template: ${existing.template_suffix}).`);
      if (existing.template_suffix !== pageDef.template_suffix) {
        console.log(`Updating template_suffix for ${pageDef.handle}...`);
        await fetch(`https://${store}/admin/api/2024-01/pages/${existing.id}.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token
          },
          body: JSON.stringify({
            page: {
              id: existing.id,
              template_suffix: pageDef.template_suffix
            }
          })
        });
      }
    } else {
      console.log(`Creating page "${pageDef.title}" (template: ${pageDef.template_suffix})...`);
      const createRes = await fetch(`https://${store}/admin/api/2024-01/pages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({
          page: {
            title: pageDef.title,
            handle: pageDef.handle,
            template_suffix: pageDef.template_suffix,
            body_html: pageDef.body_html,
            published: true
          }
        })
      });
      const created = await createRes.json();
      console.log(`Created page ${pageDef.title}: ID ${created.page?.id}`);
    }
  }
}

main().catch(console.error);
