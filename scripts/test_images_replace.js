const fs = require('fs');
const path = require('path');

const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));
const urlMap = JSON.parse(fs.readFileSync('raw_site/url_to_local_images.json', 'utf8'));

// Sort keys by length descending so longer urls with query params get replaced before shorter prefix urls
const sortedUrls = Object.keys(urlMap).sort((a, b) => b.length - a.length);

let totalReplaced = 0;
let remainingRemote = 0;

summary.forEach(p => {
  const f = path.join('raw_site/snippets', `page_${p.index}_${p.pagePath}.html`);
  let content = fs.readFileSync(f, 'utf8');
  let replacedInPage = 0;

  for (const url of sortedUrls) {
    if (content.includes(url)) {
      const regex = new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        replacedInPage += matches.length;
        content = content.replace(regex, urlMap[url]);
      }
    }
  }

  // Check if any rmcdn remains
  const remaining = content.match(/https?:\/\/[^"'\s)]*rmcdn[^"'\s)]*/g) || [];
  totalReplaced += replacedInPage;
  remainingRemote += remaining.length;
  console.log(`[${p.index}] ${p.title}: replaced ${replacedInPage} images. Remaining remote: ${remaining.length}`);
  if (remaining.length > 0) {
    console.log('   Sample remaining:', remaining.slice(0, 3));
  }
});

console.log(`\nTotal replaced: ${totalReplaced}, Total remaining remote: ${remainingRemote}`);
