const fs = require('fs');

const viewerCss = fs.readFileSync('assets/css/viewer.css', 'utf8');
const studioCss = fs.readFileSync('assets/css/studio.css', 'utf8');

console.log('Fixed in viewer.css:');
(viewerCss.match(/[^{}]*\{[^}]*position:\s*fixed[^}]*\}/g) || []).forEach(r => console.log('  ', r.slice(0, 100)));

console.log('\nFixed in studio.css:');
(studioCss.match(/[^{}]*\{[^}]*position:\s*fixed[^}]*\}/g) || []).forEach(r => console.log('  ', r.slice(0, 100)));
