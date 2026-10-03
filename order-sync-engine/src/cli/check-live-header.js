async function checkHeader() {
  const res = await fetch('https://mahekh.in', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  
  console.log('HTTP Status:', res.status);
  console.log('Includes /collections/perfumes:', html.includes('/collections/perfumes'));
  console.log('Includes /collections/car-perfumes:', html.includes('/collections/car-perfumes'));
  console.log('Includes "Car Perfumes":', html.includes('Car Perfumes'));
  console.log('Includes "Perfumes":', html.includes('Perfumes'));

  const navMatch = html.match(/<nav class="header__inline-menu">([\s\S]*?)<\/nav>/);
  if (navMatch) {
    console.log('\n--- Inline Menu HTML ---');
    console.log(navMatch[1].trim());
  }
}

checkHeader().catch(console.error);
