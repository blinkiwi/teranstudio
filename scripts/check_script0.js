const fs = require('fs');
const html = fs.readFileSync('raw_site/index.html', 'utf8');

// Find all JSON scripts
const jsonScripts = html.match(/<script type="application\/json"[\s\S]*?<\/script>/gi) || [];
console.log('jsonScripts count:', jsonScripts.length);
jsonScripts.forEach((s, idx) => {
  console.log(`Script ${idx} length:`, s.length);
  // Extract data-content or innerHTML
  const m = s.match(/data-content="([\s\S]*?)"/);
  if (m) {
    const decoded = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    console.log(`Script ${idx} data-content length:`, decoded.length);
    try {
      const parsed = JSON.parse(decoded);
      console.log(`Script ${idx} keys:`, Object.keys(parsed));
      if (parsed.project) console.log('project keys:', Object.keys(parsed.project));
      if (parsed.pages) console.log('pages keys:', Object.keys(parsed.pages));
    } catch (e) {
      console.log('parse error:', e.message);
    }
  }
});
