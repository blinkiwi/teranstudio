const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));
const mag = data.mags.mag;

console.log('aboveAllWidgets length:', mag.aboveAllWidgets.length);

// Sample widgets with animation
mag.aboveAllWidgets.forEach((w, i) => {
  if (w.animation && w.animation.length > 0) {
    console.log(`\n--- Widget ${i} (id: ${w._id}, type: ${w.type}) ---`);
    console.log('Animation:', JSON.stringify(w.animation, null, 2));
  }
});
