const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

const m = s.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
if (m) {
  console.log('First style tag inside snippet:');
  console.log(m[1]);
}

const secondStyle = s.match(/<style[^>]*>[\s\S]*?<\/style>[\s\S]*?<style[^>]*>([\s\S]*?)<\/style>/i);
if (secondStyle) {
  console.log('Second style tag:');
  console.log(secondStyle[1]);
}
