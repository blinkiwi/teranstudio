const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_1_lost-sock.html', 'utf8');

const pics = s.match(/<div class="rmwidget widget-picture[^"]*"[\s\S]*?<\/div>/gi) || [];
console.log('Total picture widgets in page 1 (Lost Sock):', pics.length);
pics.slice(0, 10).forEach((p, i) => {
  const src = (p.match(/src="([^"]+)"/) || [])[1];
  const style = (p.match(/style="([^"]+)"/) || [])[1];
  console.log(`[Pic ${i}]:`, src ? src.slice(0, 60) : 'no src', '| style:', style ? style.slice(0, 80) : '');
});
