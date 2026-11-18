const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

// Find all pictures and their data-id or alt or context
const pics = s.match(/<div class="rmwidget widget-picture[^"]*"[\s\S]*?<\/div>/gi) || [];
console.log('Total picture widgets in page 0:', pics.length);
pics.slice(0, 10).forEach((p, i) => {
  const src = (p.match(/src="([^"]+)"/) || [])[1];
  const style = (p.match(/style="([^"]+)"/) || [])[1];
  console.log(`[Pic ${i}]:`, src ? src.slice(0, 60) : 'no src', '| style:', style ? style.slice(0, 80) : '');
});
