const fs = require('fs');
const html = fs.readFileSync('raw_site/index.html', 'utf8');

console.log('Contains id="mags":', html.includes('id="mags"'));
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (bodyMatch) {
  const body = bodyMatch[1];
  console.log('Body length:', body.length);
  // Find non-script tags in body
  const nonScripts = body.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
  console.log('Non-script body content length:', nonScripts.length);
  console.log('Non-script preview:', nonScripts.slice(0, 500));
}
