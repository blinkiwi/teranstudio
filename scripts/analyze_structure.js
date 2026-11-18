const fs = require('fs');
const idx = fs.readFileSync('index.html', 'utf8');

// animation-container instances
const animContMatch = idx.match(/animation-container[^>]{0,200}/g) || [];
console.log('=== animation-container (first 2) ===');
animContMatch.slice(0,2).forEach(m => console.log(m.substring(0,120)));

// Article height
const artH = idx.match(/data-original-height="([^"]+)"/);
console.log('\n=== data-original-height ===', artH ? artH[1] : 'NOT FOUND');

// Widget counts
const pics   = (idx.match(/widget-picture/g)   || []).length;
const texts  = (idx.match(/widget-text-v3/g)   || []).length;
const shapes = (idx.match(/widget-shape/g)     || []).length;
console.log('\n=== widget counts in index.html ===');
console.log('widget-picture:', pics, '| widget-text-v3:', texts, '| widget-shape:', shapes);

// Check for zoom values
const zoomMatch = idx.match(/zoom:\s*[\d.]+/g) || [];
const uniqueZooms = [...new Set(zoomMatch)];
console.log('\n=== zoom values ===', uniqueZooms.join(', '));

// content-scroll-wrapper height
const cswH = idx.match(/content-scroll-wrapper[^>]{0,300}/);
console.log('\n=== content-scroll-wrapper style ===');
if (cswH) console.log(cswH[0].substring(0,200));

// About page height
const about = fs.readFileSync('about.html', 'utf8');
const aH = about.match(/data-original-height="([^"]+)"/);
console.log('\n=== about.html data-original-height ===', aH ? aH[1] : 'NOT FOUND');

// Count all pages heights
const pages = ['index.html','lost-sock.html','about.html','contact.html','motorkat.html'];
pages.forEach(p => {
  const c = fs.readFileSync(p, 'utf8');
  const h = c.match(/data-original-height="([^"]+)"/);
  console.log(p, '→ height:', h ? h[1] : '?');
});
