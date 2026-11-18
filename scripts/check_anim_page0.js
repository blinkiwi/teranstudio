const fs = require('fs');
const s = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

const animContainers = s.match(/<div class="animation-container"[\s\S]*?<\/div>/gi) || [];
console.log('Total animation containers in page 0:', animContainers.length);
if (animContainers.length > 0) {
  console.log('Sample anim container:');
  console.log(animContainers[0].slice(0, 500));
}

// Check onhover animations
const hovers = s.match(/has-onhover-animation/gi) || [];
console.log('Total has-onhover-animation widgets:', hovers.length);

// Check links
const links = s.match(/<a[^>]+href="[^"]+"[^>]*>[\s\S]*?<\/a>/gi) || [];
console.log('Total link elements in page 0:', links.length);
links.slice(0, 10).forEach(l => console.log('Link:', l.replace(/\n/g, ' ')));
