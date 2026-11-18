const fs = require('fs');
const path = require('path');

const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));
const urlMap = JSON.parse(fs.readFileSync('raw_site/url_to_local_images.json', 'utf8'));

// Build map from filename only:
// e.g. "image-1a9267e4-c1cb-41ba-bec8-8ac3f37d1b54.png" -> "assets/images/image-1a9267e4-c1cb-41ba-bec8-_...png"
const filenameToLocalMap = {};
Object.keys(urlMap).forEach(u => {
  const clean = u.replace(/&amp;/g, '&').split('?')[0];
  const basename = path.basename(clean);
  filenameToLocalMap[basename] = urlMap[u];
});

console.log('Indexed filenames:', Object.keys(filenameToLocalMap).length);

let matched = 0;
let unmatched = 0;
const unmatchedList = new Set();

summary.forEach(p => {
  const f = path.join('raw_site/snippets', `page_${p.index}_${p.pagePath}.html`);
  const content = fs.readFileSync(f, 'utf8');
  const urls = content.match(/https?:\/\/[^"'\s)]*rmcdn[^"'\s)]*/g) || [];
  urls.forEach(u => {
    const clean = u.replace(/&amp;/g, '&').split('?')[0];
    const basename = path.basename(clean);
    if (filenameToLocalMap[basename]) {
      matched++;
    } else {
      unmatched++;
      unmatchedList.add(u);
    }
  });
});

console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);
if (unmatched > 0) {
  console.log('Unmatched:', Array.from(unmatchedList));
}
