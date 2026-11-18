const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));
const mag = data.mags.mag;

console.log('Mag keys:', Object.keys(mag));
console.log('Mag title:', mag.title);
console.log('Mag domain:', mag.domain);

console.log('\n--- Pages sample (Page 0) ---');
console.log(JSON.stringify(mag.pages[0], null, 2).slice(0, 1500));

console.log('\n--- All page slugs/urls ---');
mag.pages.forEach((p, i) => {
  console.log(`[${i}] Title: "${p.title}" | PageNumber: ${p.pageNumber} | URL/Slug: ${p.permalink || p.url || p.slug || p.path || p.alias || 'none'} | Id: ${p.id || p._id}`);
});
