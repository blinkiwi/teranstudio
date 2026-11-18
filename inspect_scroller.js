const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_1_lost-sock.html', 'utf8');

console.log('Contains content-scroll-wrapper:', s.includes('content-scroll-wrapper'));
console.log('Contains page-with-fixeds-desktop:', s.includes('page-with-fixeds-desktop'));

// Find all top-level children of article
const m = s.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
if (m) {
  const content = m[1];
  // Match first-level div tags
  const topDivs = content.match(/<div [^>]+ class="([^"]+)"[^>]*>/gi) || [];
  console.log('Top divs count:', topDivs.length);
  topDivs.slice(0, 10).forEach(d => console.log('  ', d.slice(0, 100)));
}
