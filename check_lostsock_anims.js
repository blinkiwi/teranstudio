const fs = require('fs');

const s = fs.readFileSync('raw_site/snippets/page_1_lost-sock.html', 'utf8');

const anims = s.match(/<div class="animation-container"[\s\S]*?<\/style>/gi) || [];
console.log('Total animation-containers in Lost Sock:', anims.length);

anims.forEach((a, i) => {
  const styleMatch = a.match(/style="([^"]*)"/);
  const keyframesMatch = a.match(/@keyframes[^{]+\{([\s\S]*?)\n\}/);
  console.log(`\n--- Animation Container ${i} ---`);
  console.log('Style:', styleMatch ? styleMatch[1].slice(0, 150) : '');
  console.log('Keyframes:', keyframesMatch ? keyframesMatch[0].replace(/\s+/g, ' ') : '');
});
