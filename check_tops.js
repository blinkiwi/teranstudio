const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_1_lost-sock.html', 'utf8');

// Find all top: ...px inside page-content-container
const m = s.match(/<div class="page-content-container"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/article>/i);
if (m) {
  const container = m[0];
  const tops = container.match(/top:\s*([0-9.]+)px/g) || [];
  console.log('Top values in page-content-container: count =', tops.length);
  const numericTops = tops.map(t => parseFloat(t.replace('top:', ''))).sort((a, b) => a - b);
  console.log('Min top:', numericTops[0], 'Max top:', numericTops[numericTops.length - 1]);
  console.log('Sample tops:', numericTops.filter((_, i) => i % 5 === 0));
}
