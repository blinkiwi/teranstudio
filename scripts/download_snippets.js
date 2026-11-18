const fs = require('fs');
const https = require('https');
const path = require('path');

const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));

if (!fs.existsSync('raw_site/snippets')) {
  fs.mkdirSync('raw_site/snippets', { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Status ${response.statusCode} for ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const page of summary) {
    const filename = `page_${page.index}_${page.pagePath}.html`;
    const dest = path.join('raw_site/snippets', filename);
    console.log(`Downloading [${page.index}] ${page.title} (${page.pagePath}) from ${page.htmlUrl}...`);
    try {
      await download(page.htmlUrl, dest);
      const stat = fs.statSync(dest);
      console.log(`  -> Saved ${filename} (${stat.size} bytes)`);
    } catch (e) {
      console.error(`  -> Failed: ${e.message}`);
    }
  }
  console.log('All downloads completed!');
}

main();
