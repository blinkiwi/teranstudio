const fs = require('fs');
const path = require('path');

const scrollIds = [
  '65eb824cda7f23003dcb2994',
  '65eb824cda7f23003dcb2995',
  '65eb824cda7f23003dcb29b8',
  '65eb824cda7f23003dcb29b9',
];

const snippetsDir = path.join(__dirname, '..', 'raw_site', 'snippets');
const files = fs.readdirSync(snippetsDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(snippetsDir, file), 'utf8');
  const found = scrollIds.filter(id => content.includes(id));
  if (found.length > 0) {
    console.log(`${file}: ${found.join(', ')}`);
  }
});
console.log('\nDone.');
