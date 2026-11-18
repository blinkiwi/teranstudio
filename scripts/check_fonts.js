const fs = require('fs');

const fontUrls = new Set();
['raw_site/webtype_fonts.css', 'raw_site/typetoday_fonts.css'].forEach(f => {
  if (fs.existsSync(f)) {
    const c = fs.readFileSync(f, 'utf8');
    const matches = c.matchAll(/url\(["']?(https:[^"')]+)["']?\)/g);
    for (const m of matches) {
      fontUrls.add(m[1]);
    }
  }
});

console.log('Total font files:', fontUrls.size);
Array.from(fontUrls).forEach(u => console.log('Font:', u));
