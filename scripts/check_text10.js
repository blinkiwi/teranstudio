const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_1_lost-sock.html', 'utf8');

const texts = s.match(/<div class="rmwidget widget-text-v3"[\s\S]*?<\/div>/gi) || [];
console.log('Text 10 raw:', texts[10]);
