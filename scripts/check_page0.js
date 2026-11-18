const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));
const mag = data.mags.mag;

console.log('Page 0 keys:', Object.keys(mag.pages[0]));
for (const k of Object.keys(mag.pages[0])) {
  const val = mag.pages[0][k];
  console.log(`  ${k}:`, typeof val, Array.isArray(val) ? `[${val.length}]` : (typeof val === 'object' && val !== null ? Object.keys(val) : val));
}
