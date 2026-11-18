const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

console.log('Has page-with-fixeds-desktop:', s.includes('page-with-fixeds-desktop'));
console.log('Has phone / mobile classes:', (s.match(/class="[^"]*(?:mobile|phone)[^"]*"/gi) || []).slice(0, 10));
console.log('Has media queries:');
const media = s.match(/@media[^{]+\{/gi) || [];
console.log(media);

// Check article tags
const articles = s.match(/<article[\s\S]*?>/gi) || [];
console.log('Articles:', articles);
