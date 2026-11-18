const fs = require('fs');
const s0 = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

const m = s0.match(/<div class="fixed-position-container polyfill-sticky">([\s\S]*?)<\/div>\s*<div class="content-scroll-wrapper/i);
if (m) {
  const content = m[1];
  console.log('Fixed container length in page 0:', content.length);
  // Find text contents
  const texts = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  texts.forEach(t => console.log('  text:', t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()));
}
