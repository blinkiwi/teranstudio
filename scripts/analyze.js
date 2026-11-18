const fs = require('fs');
const html = fs.readFileSync('raw_site/index.html', 'utf8');

console.log('Length:', html.length);
console.log('Title:', (html.match(/<title>(.*?)<\/title>/i) || [])[1]);
console.log('Has __NEXT_DATA__:', html.includes('__NEXT_DATA__'));
console.log('Has Nuxt:', html.includes('__NUXT__'));
console.log('Has Webflow:', html.includes('webflow'));
console.log('Has Framer:', html.includes('framer'));

// Find links
const links = new Set();
const linkMatches = html.matchAll(/href=["']([^"']+)["']/g);
for (const m of linkMatches) {
  links.add(m[1]);
}
console.log('\n--- Internal & External Links ---');
for (const l of links) {
  console.log(l);
}

// Find scripts
console.log('\n--- Scripts ---');
const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
for (const m of scriptMatches) {
  console.log(m[1]);
}

// Find stylesheets
console.log('\n--- Stylesheets ---');
const styleMatches = html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g);
for (const m of styleMatches) {
  console.log(m[1]);
}

// Check some head meta tags
console.log('\n--- Meta Description / OG ---');
const metaMatches = html.matchAll(/<meta[^>]+(?:name|property)=["']([^"']+)["'][^>]+content=["']([^"']+)["']/g);
for (const m of metaMatches) {
  console.log(`${m[1]}: ${m[2]}`);
}
