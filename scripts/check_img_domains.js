const fs = require('fs');
const assets = JSON.parse(fs.readFileSync('raw_site/all_assets.json', 'utf8'));

console.log('Total images:', assets.images.length);
const domains = {};
assets.images.forEach(img => {
  try {
    const u = new URL(img);
    domains[u.hostname] = (domains[u.hostname] || 0) + 1;
  } catch (e) {}
});

console.log('Image domains:', domains);
