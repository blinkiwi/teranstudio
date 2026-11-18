const fs = require('fs');
const path = require('path');
const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));

summary.forEach(p => {
  const filename = `page_${p.index}_${p.pagePath}.html`;
  const snippet = fs.readFileSync(path.join('raw_site/snippets', filename), 'utf8');
  const m = snippet.match(/<article[^>]+style="([^"]+)"/);
  console.log(`[${p.index}] ${p.title} (${p.pagePath}): style="${m ? m[1] : 'none'}"`);
});
