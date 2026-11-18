const fs = require('fs');
const snippet = fs.readFileSync('raw_site/page0_snippet.html', 'utf8');

console.log('Snippet length:', snippet.length);

// Check if snippet contains script tags
const scripts = snippet.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Scripts inside snippet:', scripts.length);

// Check widgets classes
const widgets = snippet.match(/class="[^"]*widget[^"]*"/gi) || [];
console.log('Widget count in snippet:', widgets.length);
const uniqueWidgets = new Set(widgets.map(w => w.replace(/class="/, '').replace(/"/, '')));
console.log('Unique widget classes:', Array.from(uniqueWidgets));

// Check styles inside snippet
const styles = snippet.match(/<style[\s\S]*?<\/style>/gi) || [];
console.log('Style tags inside snippet:', styles.length);

// Check images inside snippet
const imgs = snippet.match(/<img[^>]+>/gi) || [];
console.log('Img tags inside snippet:', imgs.length);

// Check SVG elements inside snippet
const svgs = snippet.match(/<svg[\s\S]*?<\/svg>/gi) || [];
console.log('SVG tags inside snippet:', svgs.length);
