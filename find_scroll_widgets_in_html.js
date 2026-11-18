const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));
const mag = data.mags.mag;

// Get all widget data-ids in page 0 snippet to match against aboveAllWidgets
const s0 = fs.readFileSync('raw_site/snippets/page_0_1.html', 'utf8');

const scrollWidgetIds = [
  '65eb824cda7f23003dcb2994',
  '65eb824cda7f23003dcb2995',
  '65eb824cda7f23003dcb29b8',
  '65eb824cda7f23003dcb29b9'
];

scrollWidgetIds.forEach(id => {
  const present = s0.includes(`data-id="${id}"`);
  console.log(`Widget ${id}: present in page 0? ${present}`);
  if (present) {
    const idx = s0.indexOf(`data-id="${id}"`);
    console.log('Context:', s0.slice(Math.max(0, idx - 50), idx + 200));
  }
});

// Find all data-ids in page 0
const allDataIds = s0.match(/data-id="([^"]+)"/g) || [];
console.log('\nAll data-ids in page 0:', allDataIds.length);

// Find matches between aboveAllWidgets and page snippet
mag.aboveAllWidgets.forEach((w, idx) => {
  const present = s0.includes(`data-id="${w._id}"`);
  if (present) {
    console.log(`aboveAllWidget ${idx} (${w._id}, type=${w.type}) -> FOUND in page 0`);
  }
});
