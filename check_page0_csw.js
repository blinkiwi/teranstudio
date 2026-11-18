const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

const idx = s.indexOf('content-scroll-wrapper');
if (idx !== -1) {
  console.log('Page 0 around content-scroll-wrapper:');
  console.log(s.slice(Math.max(0, idx - 100), idx + 500));
}
