const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));
const mag = data.mags.mag;

const pagesSummary = mag.pages.map((p, idx) => ({
  index: idx,
  id: p._id,
  title: p.title,
  pagePath: p.pagePath,
  num: p.num,
  htmlUrl: p.htmlUrl,
  screenshot: p.screenshot,
  customShareImage: p.custom_shares && p.custom_shares.image,
  seoTitle: p.seo && p.seo.title,
  seoDescription: p.seo && p.seo.description,
  widsCount: p.wids ? p.wids.length : 0
}));

console.log(JSON.stringify(pagesSummary, null, 2));
fs.writeFileSync('raw_site/pages_summary.json', JSON.stringify(pagesSummary, null, 2));
