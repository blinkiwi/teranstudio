const fs = require('fs');

const html = fs.readFileSync('lost-sock.html', 'utf8');

// Check what CSS files are loaded and in what order
const cssLinks = html.match(/<link[^>]+stylesheet[^>]*>/gi) || [];
console.log('CSS links in lost-sock.html:');
cssLinks.forEach(l => console.log('  ', l));

// Check article style in lost-sock.html
const articleMatch = html.match(/<article[^>]*>/i);
console.log('Article tag in lost-sock.html:');
console.log('  ', articleMatch ? articleMatch[0] : 'not found');
