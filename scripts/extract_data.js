const fs = require('fs');
const html = fs.readFileSync('raw_site/index.html', 'utf8');

const match = html.match(/window\.ServerData\s*=\s*(\{[\s\S]*?\});\s*(?:window\.viewerConfig|<\/script>)/);
if (!match) {
  console.log('Could not match window.ServerData');
  process.exit(1);
}

const serverData = JSON.parse(match[1]);
fs.writeFileSync('raw_site/server_data.json', JSON.stringify(serverData, null, 2));

console.log('ServerData keys:', Object.keys(serverData));
if (serverData.mags) {
  console.log('mags keys:', Object.keys(serverData.mags));
  const mag = serverData.mags.mag;
  if (mag) {
    console.log('mag title:', mag.title || mag.name);
    console.log('mag id:', mag.id);
    console.log('pages count:', mag.pages ? mag.pages.length : 0);
    if (mag.pages) {
      mag.pages.forEach((p, idx) => {
        console.log(`Page ${idx}: id=${p.id}, url=${p.url || p.slug || p.title || p.name}, title=${p.title || p.name}, widgets=${p.widgets ? p.widgets.length : 0}`);
      });
    }
  }
}
