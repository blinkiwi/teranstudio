const fs = require('fs');
const path = require('path');
const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));

summary.forEach(p => {
  const filename = `page_${p.index}_${p.pagePath}.html`;
  const snippet = fs.readFileSync(path.join('raw_site/snippets', filename), 'utf8');
  const links = snippet.match(/href="([^"]+)"/g) || [];
  const uniqueLinks = Array.from(new Set(links.map(l => l.replace(/href="|"/g, ''))));
  console.log(`\nPage [${p.index}] ${p.title}: ${uniqueLinks.length} unique links:`);
  uniqueLinks.forEach(l => console.log('  ', l));
});
