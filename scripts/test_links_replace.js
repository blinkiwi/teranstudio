const fs = require('fs');
const path = require('path');

const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));

const linkReplacements = [
  { match: /\/4663589\/lost-sock\/?/g, to: 'lost-sock.html' },
  { match: /\/4663589\/motorkat\/?/g, to: 'motorkat.html' },
  { match: /\/4663589\/zinnia\/?/g, to: 'zinnia.html' },
  { match: /\/4663589\/peoples-book\/?/g, to: 'peoples-book.html' },
  { match: /\/4663589\/soko\/?/g, to: 'soko.html' },
  { match: /\/4663589\/indigro\/?/g, to: 'indigro.html' },
  { match: /\/4663589\/atlantic-rhythms-1\/?/g, to: 'atlantic-rhythms-1.html' },
  { match: /\/4663589\/atlantic-rhythms-2\/?/g, to: 'atlantic-rhythms-2.html' },
  { match: /\/4663589\/no-way\/?/g, to: 'no-way.html' },
  { match: /\/4663589\/abcdc\/?/g, to: 'abcdc.html' },
  { match: /\/4663589\/about\/?/g, to: 'about.html' },
  { match: /\/4663589\/contact\/?/g, to: 'contact.html' },
  { match: /\/4663589\/?(?=["'#\s])/g, to: 'index.html' },
  { match: /https:\/\/noplan\.studio\/lost-sock\/?/g, to: 'lost-sock.html' },
  { match: /https:\/\/noplan\.studio\/?(?=["'#\s])/g, to: 'index.html' }
];

summary.forEach(p => {
  const f = path.join('raw_site/snippets', `page_${p.index}_${p.pagePath}.html`);
  let content = fs.readFileSync(f, 'utf8');
  let count = 0;
  linkReplacements.forEach(r => {
    const matches = content.match(r.match);
    if (matches) {
      count += matches.length;
      content = content.replace(r.match, r.to);
    }
  });
  console.log(`[${p.index}] ${p.title}: replaced ${count} internal links.`);
});
