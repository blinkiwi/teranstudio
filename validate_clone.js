const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'lost-sock.html',
  'motorkat.html',
  'zinnia.html',
  'peoples-book.html',
  'soko.html',
  'indigro.html',
  'atlantic-rhythms-1.html',
  'atlantic-rhythms-2.html',
  'no-way.html',
  'abcdc.html',
  'about.html',
  'contact.html'
];

let totalImagesChecked = 0;
let missingImages = 0;
let totalLinksChecked = 0;
let brokenLinks = 0;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');

  // Check images
  const imgMatches = content.matchAll(/(?:src|srcset)=["']([^"']+)["']/g);
  for (const m of imgMatches) {
    const rawVal = m[1];
    // srcset might have "path 2x, path 3x"
    const parts = rawVal.split(',').map(p => p.trim().split(' ')[0]);
    parts.forEach(imgPath => {
      if (imgPath.startsWith('assets/images/')) {
        totalImagesChecked++;
        if (!fs.existsSync(imgPath)) {
          missingImages++;
          console.error(`[${f}] Missing image: ${imgPath}`);
        }
      }
    });
  }

  // Check internal href links
  const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
  for (const m of hrefMatches) {
    const href = m[1];
    if (href.endsWith('.html')) {
      totalLinksChecked++;
      if (!fs.existsSync(href)) {
        brokenLinks++;
        console.error(`[${f}] Broken link: ${href}`);
      }
    }
  }
});

console.log('=== VALIDATION SUMMARY ===');
console.log(`Total images checked: ${totalImagesChecked}`);
console.log(`Missing images: ${missingImages}`);
console.log(`Total internal links checked: ${totalLinksChecked}`);
console.log(`Broken internal links: ${brokenLinks}`);

if (missingImages === 0 && brokenLinks === 0) {
  console.log('✓ ALL IMAGES AND LINKS ARE 100% VALID AND LOCAL!');
} else {
  console.log('⚠ Found discrepancies to fix.');
}
