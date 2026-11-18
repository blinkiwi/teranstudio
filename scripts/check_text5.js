const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

const texts = s.match(/<div class="rmwidget widget-text-v3"[\s\S]*?<\/div>/gi) || [];
console.log('Text 5 raw:');
console.log(texts[5]);
