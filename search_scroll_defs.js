const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));

// Search for any object with animation or scroll
function searchObj(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) {
    const cur = path ? `${path}.${k}` : k;
    if (k.toLowerCase().includes('anim') || k.toLowerCase().includes('scroll')) {
      console.log(`Key match at: ${cur} ->`, typeof obj[k], Array.isArray(obj[k]) ? `[${obj[k].length}]` : typeof obj[k] === 'object' ? Object.keys(obj[k]) : obj[k]);
    }
    if (typeof obj[k] === 'object' && path.split('.').length < 6) {
      searchObj(obj[k], cur);
    }
  }
}

searchObj(data.mags.mag);
