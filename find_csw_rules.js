const fs = require('fs');
const css = fs.readFileSync('assets/css/viewer.css', 'utf8');

const matches = css.match(/[^{}]*content-scroll-wrapper[^{}]*\{[^}]*\}/g) || [];
console.log('Matches for content-scroll-wrapper:');
matches.forEach(m => console.log('  ', m));
