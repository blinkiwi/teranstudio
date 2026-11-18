// Inspect the index.html article/content area in detail
const fs = require('fs');

// Check all pages
const pagesConfig = [
  'index.html','lost-sock.html','motorkat.html','zinnia.html','peoples-book.html',
  'soko.html','indigro.html','atlantic-rhythms-1.html','atlantic-rhythms-2.html',
  'no-way.html','abcdc.html','about.html','contact.html'
];

pagesConfig.forEach(p => {
  const c = fs.readFileSync(p, 'utf8');
  const h = (c.match(/data-original-height="([^"]+)"/) || [])[1] || '?';
  const pics = (c.match(/widget-picture/g) || []).length;
  const anim = (c.match(/animation-container/g) || []).length;
  const hasParallax = c.includes('page-fixed-bg-container');
  const hasBg = c.includes('widget-background');
  console.log(`${p}: h=${h}px, pics=${pics}, anim-containers=${anim}, parallax-bg=${hasParallax}, widget-bg=${hasBg}`);
});

// Also check what CSS keyframes are in index.html animation-containers
const idx = fs.readFileSync('index.html', 'utf8');
const keyframes = idx.match(/@keyframes\s+[a-z0-9_-]+\s*\{[^}]+\}/gi) || [];
console.log('\n=== CSS keyframes in index.html ===');
keyframes.forEach(kf => console.log(kf.substring(0,200)));

// Check if data-id of scroll widgets appears in animation-containers
const scrollIds = ['65eb824cda7f23003dcb2994','65eb824cda7f23003dcb2995','65eb824cda7f23003dcb29b8','65eb824cda7f23003dcb29b9'];
scrollIds.forEach(id => {
  const regex = new RegExp('.{0,300}' + id + '.{0,300}');
  const m = idx.match(regex);
  if (m) console.log('\nContext for', id, ':\n', m[0].substring(0,300));
});
