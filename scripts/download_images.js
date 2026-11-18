const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const assets = JSON.parse(fs.readFileSync('raw_site/all_assets.json', 'utf8'));
const imagesDir = path.join(__dirname, 'assets', 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate unique local filename for each URL (clean URL)
const urlToLocalMap = {};
assets.images.forEach(rawUrl => {
  const cleanUrl = rawUrl.replace(/&amp;/g, '&');
  const pathOnly = cleanUrl.split('?')[0];
  let ext = path.extname(pathOnly) || '.png';
  if (ext.length > 5 || ext.includes('/')) ext = '.png';
  const baseName = path.basename(pathOnly, ext);
  const hash = crypto.createHash('md5').update(cleanUrl).digest('hex').slice(0, 8);
  const localName = `${baseName.slice(0, 30)}_${hash}${ext}`;
  const localRel = 'assets/images/' + localName;
  urlToLocalMap[rawUrl] = localRel;
  urlToLocalMap[cleanUrl] = localRel;
});

fs.writeFileSync('raw_site/url_to_local_images.json', JSON.stringify(urlToLocalMap, null, 2));

function download(rawUrl, dest) {
  const url = rawUrl.replace(/&amp;/g, '&');
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      return resolve({ success: true, cached: true });
    }
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        return resolve({ success: false, status: res.statusCode, url });
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve({ success: true }));
      });
    });
    req.on('error', (err) => {
      fs.unlink(dest, () => {});
      resolve({ success: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      fs.unlink(dest, () => {});
      resolve({ success: false, error: 'timeout' });
    });
  });
}

async function downloadAll() {
  const uniqueUrls = Array.from(new Set(assets.images.map(u => u.replace(/&amp;/g, '&'))));
  console.log(`Starting download of ${uniqueUrls.length} unique images...`);
  const concurrency = 8;
  let idx = 0;
  let successCount = 0;
  let failCount = 0;

  async function worker() {
    while (idx < uniqueUrls.length) {
      const currentIdx = idx++;
      const url = uniqueUrls[currentIdx];
      const localRel = urlToLocalMap[url];
      const localAbs = path.join(__dirname, localRel);
      const res = await download(url, localAbs);
      if (res.success) {
        successCount++;
      } else {
        failCount++;
        console.log(`Failed [${res.status || res.error}]: ${url.slice(0, 80)}`);
      }
      if ((currentIdx + 1) % 25 === 0 || currentIdx === uniqueUrls.length - 1) {
        console.log(`Progress: ${currentIdx + 1}/${uniqueUrls.length} (Success: ${successCount}, Fail: ${failCount})`);
      }
    }
  }

  const workers = Array(concurrency).fill(0).map(() => worker());
  await Promise.all(workers);
  console.log(`Completed downloading images! Success: ${successCount}, Fail: ${failCount}`);
}

downloadAll();
