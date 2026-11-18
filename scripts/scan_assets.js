const fs = require('fs');
const path = require('path');

const snippetsDir = 'raw_site/snippets';
const files = fs.readdirSync(snippetsDir);

const allImages = new Set();
const allLinks = new Set();
const allStyles = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(snippetsDir, file), 'utf8');
  
  // Find images src / data-src
  const imgMatches = content.matchAll(/(?:src|data-src|srcset)=["']([^"']+)["']/g);
  for (const m of imgMatches) {
    if (m[1].startsWith('http')) {
      allImages.add(m[1].split(' ')[0]);
    }
  }

  // Find css url(...)
  const bgMatches = content.matchAll(/url\(["']?([^"')]+)["']?\)/g);
  for (const m of bgMatches) {
    if (m[1].startsWith('http')) {
      allImages.add(m[1]);
    }
  }

  // Find href links
  const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
  for (const m of hrefMatches) {
    allLinks.add(m[1]);
  }
});

console.log('Total unique image/media URLs:', allImages.size);
console.log('Sample images:');
Array.from(allImages).slice(0, 15).forEach(img => console.log(' ', img));

console.log('\nTotal unique links:', allLinks.size);
console.log('Sample links:');
Array.from(allLinks).forEach(l => console.log(' ', l));

fs.writeFileSync('raw_site/all_assets.json', JSON.stringify({
  images: Array.from(allImages),
  links: Array.from(allLinks)
}, null, 2));
