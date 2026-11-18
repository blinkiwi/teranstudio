const fs = require('fs');
const html = fs.readFileSync('raw_site/index.html', 'utf8');

// Find all css link tags
const links = html.match(/<link[^>]+>/gi) || [];
console.log('--- LINK TAGS ---');
links.forEach(l => console.log(l));

// Find all style tags
const styles = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
console.log('\n--- STYLE TAGS count:', styles.length);
styles.forEach((s, i) => {
  console.log(`Style ${i} length: ${s.length}, preview: ${s.slice(0, 150).replace(/\n/g, ' ')}`);
});
