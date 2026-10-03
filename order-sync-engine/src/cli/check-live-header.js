async function checkHeader() {
  const c1Res = await fetch('https://mahekh.in/collections/best-selling-attars');
  const c2Res = await fetch('https://mahekh.in/collections/combo-attars');
  const homeRes = await fetch('https://mahekh.in', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const homeHtml = await homeRes.text();

  console.log('Best Sellers Status:', c1Res.status);
  console.log('Combo Attars Status:', c2Res.status);
  console.log('Home Status:', homeRes.status);
  console.log('Contains /collections/combo-attars:', homeHtml.includes('/collections/combo-attars'));
  console.log('Contains "Combo Attars":', homeHtml.includes('Combo Attars'));

  const navMatch = homeHtml.match(/<nav class="header__inline-menu">([\s\S]*?)<\/nav>/);
  if (navMatch) {
    console.log('\n--- Live Inline Menu HTML ---');
    console.log(navMatch[1].trim());
  }
}

checkHeader().catch(console.error);
