import { ShopifyClient } from '../shopify/client.js';

const pagesToRestore = [
  {
    title: 'Track Order',
    handle: 'track-order',
    template_suffix: 'track-order',
    body_html: '<p>Track your Mahekh Fragrances parcel live across BlueDart, Delhivery, Ekart, and Shiprocket.</p>',
  },
  {
    title: 'Customer Intelligence & COD Safety',
    handle: 'customer-intelligence',
    template_suffix: 'customer-intelligence',
    body_html: '<p>Mahekh Customer Intelligence System - AI-powered delivery validation and real-time order history.</p>',
  },
  {
    title: 'Heritage & Craftsmanship',
    handle: 'heritage-process',
    template_suffix: 'heritage-process',
    body_html: '<p>Discover the centuries-old traditional Deg & Bhapka distillation process behind Mahekh authentic attars.</p>',
  },
  {
    title: 'ROAS Cockpit & Analytics',
    handle: 'roas-cockpit',
    template_suffix: 'roas-cockpit',
    body_html: '<p>Mahekh Live Marketing, ROAS & Performance Intelligence Cockpit.</p>',
  },
  {
    title: 'Contact Us',
    handle: 'contact',
    template_suffix: 'contact',
    body_html: '<p>Have questions about your order or our fragrances? Contact our 24/7 dedicated support team.</p>',
  },
  {
    title: 'About Us',
    handle: 'about-us',
    template_suffix: null,
    body_html: '<p>Mahekh Fragrances brings the pure, alcohol-free essence of Indian botanical distillation to the modern world.</p>',
  },
  {
    title: 'Privacy Policy',
    handle: 'privacy-policy',
    template_suffix: null,
    body_html: '<p>Your privacy and data protection are of utmost importance at Mahekh Fragrances.</p>',
  },
  {
    title: 'Refund & Cancellation Policy',
    handle: 'refund-policy',
    template_suffix: null,
    body_html: '<p>We stand by the quality of our perfumes with our 100% Satisfaction Guarantee.</p>',
  },
  {
    title: 'Shipping Policy',
    handle: 'shipping-policy',
    template_suffix: null,
    body_html: '<p>Fast, reliable express shipping across all pin codes in India with live tracking updates via WhatsApp and SMS.</p>',
  },
  {
    title: 'Terms of Service',
    handle: 'terms-of-service',
    template_suffix: null,
    body_html: '<p>Terms and conditions governing the use and purchase of Mahekh Fragrances products.</p>',
  },
];

async function restoreAllPages() {
  console.log(`\n======================================================`);
  console.log(`Starting Pages Restoration to Shopify`);
  console.log(`======================================================\n`);

  const shopify = new ShopifyClient();

  let existingPages = [];
  try {
    existingPages = await shopify.paginate('/pages.json', 'pages', { limit: '250' });
    console.log(`Found ${existingPages.length} existing pages.`);
  } catch (err) {
    console.warn(`Could not list pages: ${err.message}`);
  }

  const existingByHandle = new Map();
  for (const p of existingPages) {
    if (p.handle) existingByHandle.set(p.handle, p);
  }

  for (const pageDef of pagesToRestore) {
    const existing = existingByHandle.get(pageDef.handle);
    if (existing) {
      console.log(`Updating existing page: ${pageDef.title} (${pageDef.handle})`);
      try {
        await shopify.request(`/pages/${existing.id}.json`, {
          method: 'PUT',
          body: JSON.stringify({
            page: {
              id: existing.id,
              template_suffix: pageDef.template_suffix,
              body_html: pageDef.body_html,
            },
          }),
        });
        console.log(`   ✔ Updated page ID ${existing.id}\n`);
      } catch (e) {
        console.error(`   ✖ Failed: ${e.message}\n`);
      }
    } else {
      console.log(`Creating page: ${pageDef.title} (${pageDef.handle}) [template: ${pageDef.template_suffix || 'default'}]`);
      try {
        const res = await shopify.request('/pages.json', {
          method: 'POST',
          body: JSON.stringify({
            page: {
              title: pageDef.title,
              handle: pageDef.handle,
              body_html: pageDef.body_html,
              template_suffix: pageDef.template_suffix,
              published: true,
            },
          }),
        });
        const created = res.data && res.data.page;
        console.log(`   ✔ Created successfully! ID: ${created ? created.id : 'OK'}\n`);
      } catch (e) {
        console.error(`   ✖ Failed: ${e.message}\n`);
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`================ Pages Restoration Complete ================\n`);
}

restoreAllPages().catch(console.error);
