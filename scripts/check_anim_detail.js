const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

const animMatch = s.match(/<div class="animation-container"[\s\S]*?<\/div>\s*<\/div>/i);
if (animMatch) {
  console.log(animMatch[0].slice(0, 1500));
}
