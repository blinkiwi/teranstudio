const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));

console.log('data keys:', Object.keys(data));
console.log('mags keys:', Object.keys(data.mags));
for (const k of Object.keys(data.mags)) {
  console.log(`data.mags.${k}:`, typeof data.mags[k], Array.isArray(data.mags[k]) ? `length ${data.mags[k].length}` : Object.keys(data.mags[k]));
}
