import https from 'https';

function checkUrl(urlStr) {
  const url = new URL(urlStr);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    }
  };

  console.log(`Checking ${urlStr}...`);
  https.get(options, (res) => {
    console.log('Status code:', res.statusCode);
    if (res.headers.location) {
      console.log('Redirect location:', res.headers.location);
      if (res.statusCode === 301 || res.statusCode === 302) {
        checkUrl(new URL(res.headers.location, urlStr).toString());
        return;
      }
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Body length:', data.length);
      const titleMatch = data.match(/<title>([^<]+)<\/title>/i);
      console.log('Page Title:', titleMatch ? titleMatch[1].trim() : 'N/A');
      console.log('Includes "Page not found":', data.includes('Page not found'));
      console.log('Includes "404":', data.includes('404'));
      
      const regex = /id="shopify-section-([^"]+)"/g;
      let match;
      const sections = [];
      while ((match = regex.exec(data)) !== null) {
        sections.push(match[1]);
      }
      console.log('Rendered sections:', sections);

      const bodyClassMatch = data.match(/<body[^>]*class="([^"]+)"/i);
      if (bodyClassMatch) {
        console.log('Body class:', bodyClassMatch[1]);
      }

      // Check if main has content
      const mainMatch = data.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        console.log('Main snippet (first 300 chars):', mainMatch[1].trim().slice(0, 300));
      }
    });
  }).on('error', err => console.error(err));
}

checkUrl('https://mahekh.in/');
