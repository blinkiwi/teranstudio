const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));
const mag = data.mags.mag;

console.log('--- ALL SCROLL ANIMATIONS IN MAG ---');

function checkWidgets(widgetsList, contextName) {
  if (!widgetsList) return;
  widgetsList.forEach((w, idx) => {
    if (w.animation) {
      w.animation.forEach((anim, animIdx) => {
        if (anim.type === 'scroll') {
          console.log(`[${contextName}] Widget #${idx} id=${w._id} type=${w.type}`);
          console.log(`  Scroll anim: steps=${anim.steps ? anim.steps.length : 0}`);
          if (anim.steps && anim.steps.length > 0) {
            const first = anim.steps[0];
            const last = anim.steps[anim.steps.length - 1];
            console.log(`  First step: rotate=${first.rotate}, dx=${first.dx}, dy=${first.dy}, opacity=${first.opacity}`);
            console.log(`  Last step: rotate=${last.rotate}, dx=${last.dx}, dy=${last.dy}, opacity=${last.opacity}`);
          }
        }
      });
    }
  });
}

checkWidgets(mag.aboveAllWidgets, 'aboveAllWidgets');
checkWidgets(mag.globalWidgets, 'globalWidgets');

// Check in each page
mag.pages.forEach((p, pIdx) => {
  if (p.widgets) {
    checkWidgets(p.widgets, `Page ${pIdx} (${p.title})`);
  }
});
