const fs = require('fs');
const path = require('path');

const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));
const localFiles = fs.readdirSync('assets/images');

// Create a map from base image id / filename to local file path
const baseMap = {};
localFiles.forEach(f => {
  // f is like: image-1a9267e4-c1cb-41ba-bec8-8ac3f37d1b54_69cb07a4.png
  // or Image-7e626ebd-8a9f-4fb8-bd6c-1800dae56a42_....png
  const m = f.match(/((?:image|Image|RasterizedImage)-[a-f0-9-]+)/i);
  if (m) {
    baseMap[m[1].toLowerCase()] = 'assets/images/' + f;
  }
});

console.log('Indexed base images in assets/images:', Object.keys(baseMap).length);

// Now test matching all rmcdn urls in all snippets
let matched = 0;
let unmatched = 0;
const unmatchedUrls = new Set();

summary.forEach(p => {
  const f = path.join('raw_site/snippets', `page_${p.index}_${p.pagePath}.html`);
  const content = fs.readFileSync(f, 'utf8');
  const urls = content.match(/https?:\/\/[^"'\s)]*rmcdn[^"'\s)]*/g) || [];
  urls.forEach(u => {
    const m = u.match(/((?:image|Image|RasterizedImage)-[a-f0-9-]+)/i);
    if (m && baseMap[m[1].toLowerCase()]) {
      matched++;
    } else {
      unmatched++;
      unmatchedUrls.add(u);
    }
  });
});

console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);
if (unmatched > 0) {
  console.log('Sample unmatched:');
  Array.from(unmatchedUrls).slice(0, 10).forEach(u => console.log(' ', u));
}
