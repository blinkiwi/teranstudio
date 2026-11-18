const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_1_lost-sock.html', 'utf8');

// Find all text contents in page 1
const texts = s.match(/<div class="rmwidget widget-text-v3"[\s\S]*?<\/div>/gi) || [];
console.log('Text widgets count in page 1:', texts.length);
texts.forEach((t, i) => {
  const plain = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain) {
    console.log(`[Text ${i}]:`, plain.slice(0, 100));
  }
});
