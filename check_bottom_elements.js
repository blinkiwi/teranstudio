const fs = require('fs');
const path = require('path');
const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));

summary.forEach(p => {
  const f = path.join('raw_site/snippets', `page_${p.index}_${p.pagePath}.html`);
  const s = fs.readFileSync(f, 'utf8');

  // Find all top: in the file
  const tops = s.match(/top:\s*([0-9.]+)px/g) || [];
  const numericTops = tops.map(t => parseFloat(t.replace('top:', ''))).sort((a, b) => a - b);
  const maxTop = numericTops.length > 0 ? numericTops[numericTops.length - 1] : 0;

  const articleHeightMatch = s.match(/<article[^>]+height:\s*([0-9.]+)px/i);
  const articleHeight = articleHeightMatch ? parseFloat(articleHeightMatch[1]) : 0;

  const boundsHeightMatch = s.match(/<div class="content-bounds"[^>]+height:\s*([0-9.]+)px/i);
  const boundsHeight = boundsHeightMatch ? parseFloat(boundsHeightMatch[1]) : 0;

  console.log(`[${p.index}] ${p.title.padEnd(25)} | max widget top: ${maxTop.toFixed(0)}px | article H: ${articleHeight}px | bounds H: ${boundsHeight}px`);
});
