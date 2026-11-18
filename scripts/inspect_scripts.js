const fs = require('fs');
const html = fs.readFileSync('raw_site/index.html', 'utf8');

// Find script contents or json
const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Total script tags:', scripts.length);

for (let i = 0; i < scripts.length; i++) {
  const s = scripts[i];
  if (s.length > 500) {
    console.log(`Script ${i} length:`, s.length, s.slice(0, 200).replace(/\n/g, ' '));
  } else {
    console.log(`Script ${i}:`, s.replace(/\n/g, ' '));
  }
}
