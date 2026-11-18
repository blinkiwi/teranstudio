const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_1_lost-sock.html', 'utf8');

const pics = s.match(/<div class="rmwidget widget-picture[^"]*"[\s\S]*?<\/div>/gi) || [];
console.log('Pic 3 raw:');
console.log(pics[3]);
