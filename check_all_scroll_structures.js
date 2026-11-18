const fs = require('fs');
const path = require('path');
const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));

summary.forEach(p => {
  const f = path.join('raw_site/snippets', `page_${p.index}_${p.pagePath}.html`);
  const s = fs.readFileSync(f, 'utf8');
  const hasFixed = s.includes('fixed-position-container');
  const hasScroll = s.includes('content-scroll-wrapper');
  const articleStyle = (s.match(/<article[^>]+style="([^"]+)"/) || [])[1] || '';
  const boundsStyle = (s.match(/<div class="content-bounds"[^>]+style="([^"]+)"/) || [])[1] || '';
  const pccStyle = (s.match(/<div class="page-content-container"[^>]+style="([^"]+)"/) || [])[1] || '';
  console.log(`[${p.index}] ${p.title.padEnd(25)} | article: ${articleStyle.replace(/overflow:[^;]+;/, '').trim()} | bounds: ${boundsStyle} | pcc: ${pccStyle.slice(0, 50)}`);
});
