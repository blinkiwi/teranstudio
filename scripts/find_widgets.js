const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));

// Search where widgets are stored
function findWidgetsKey(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) {
    const currentPath = path ? `${path}.${k}` : k;
    if (k === 'widgets' || k === 'widget' || k === 'widgetsMap') {
      console.log(`Found widget key at: ${currentPath}, type: ${Array.isArray(obj[k]) ? 'array[' + obj[k].length + ']' : typeof obj[k]}`);
    } else if (typeof obj[k] === 'object' && path.split('.').length < 4) {
      findWidgetsKey(obj[k], currentPath);
    }
  }
}

findWidgetsKey(data);
