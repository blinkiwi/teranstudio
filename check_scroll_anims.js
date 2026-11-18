const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));
const mag = data.mags.mag;

console.log('hasAnimations:', mag.hasAnimations);
console.log('usedAnimationTypes:', mag.usedAnimationTypes);
console.log('hasWidgetsWithVerticalOnscrollAnimation:', mag.hasWidgetsWithVerticalOnscrollAnimation);

// Check widgets in mag or pages
let totalAnimWidgets = 0;
mag.pages.forEach((p, idx) => {
  // Check if page has animations or widgets
  console.log(`Page [${idx}] ${p.title}: wids count=${p.wids ? p.wids.length : 0}`);
});
