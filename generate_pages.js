const fs = require('fs');
const path = require('path');

const summary = JSON.parse(fs.readFileSync('raw_site/pages_summary.json', 'utf8'));
const urlMap = JSON.parse(fs.readFileSync('raw_site/url_to_local_images.json', 'utf8'));

// Build filename-to-local map
const filenameMap = {};
Object.keys(urlMap).forEach(u => {
  const clean = u.replace(/&amp;/g, '&').split('?')[0];
  const b = path.basename(clean);
  filenameMap[b] = urlMap[u];
  filenameMap[b.toLowerCase()] = urlMap[u];
});

// Map page indices to target filenames and clean titles
const pagesConfig = [
  { index: 0, path: '1', file: 'index.html', title: 'Terán Studio — Design and Art Studio', isProject: false, tag: 'Studio Home' },
  { index: 1, path: 'lost-sock', file: 'lost-sock.html', title: 'Lost Sock Roasters — Terán Studio', isProject: true, tag: '01 / Branding & Coffee' },
  { index: 2, path: 'motorkat', file: 'motorkat.html', title: 'Motorkat — Terán Studio', isProject: true, tag: '02 / Wood Grill & Raw Bar' },
  { index: 3, path: 'zinnia', file: 'zinnia.html', title: 'Zinnia — Terán Studio', isProject: true, tag: '03 / Multi-Restaurant Concept' },
  { index: 4, path: 'peoples-book', file: 'peoples-book.html', title: 'People’s Book — Terán Studio', isProject: true, tag: '04 / Bookstore Identity' },
  { index: 5, path: 'soko', file: 'soko.html', title: 'SOKO — Terán Studio', isProject: true, tag: '05 / Butcher Shop & Deli' },
  { index: 6, path: 'indigro', file: 'indigro.html', title: 'Indigro — Terán Studio', isProject: true, tag: '06 / Houseplant Studio' },
  { index: 7, path: 'atlantic-rhythms-1', file: 'atlantic-rhythms-1.html', title: 'Goodnight Shiva — Terán Studio', isProject: true, tag: '07 / Cassette J-Card' },
  { index: 8, path: 'atlantic-rhythms-2', file: 'atlantic-rhythms-2.html', title: 'Miru Mira — Terán Studio', isProject: true, tag: '08 / Cassette J-Card' },
  { index: 9, path: 'no-way', file: 'no-way.html', title: 'No Way — Terán Studio', isProject: true, tag: '09 / 2,100 sq ft Mural' },
  { index: 10, path: 'abcdc', file: 'abcdc.html', title: 'ABCDC — Terán Studio', isProject: true, tag: '10 / Cherry Blossom Sculpture' },
  { index: 11, path: 'about', file: 'about.html', title: 'About — Terán Studio', isProject: false, tag: 'About Studio' },
  { index: 12, path: 'contact', file: 'contact.html', title: 'Contact — Terán Studio', isProject: false, tag: 'Get In Touch' }
];

const projectsOnly = pagesConfig.filter(p => p.isProject);

function replaceImagesInSnippet(content) {
  // Replace direct matching URLs (longest first)
  const sortedUrls = Object.keys(urlMap).sort((a, b) => b.length - a.length);
  for (const u of sortedUrls) {
    if (content.includes(u)) {
      const reg = new RegExp(u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(reg, urlMap[u]);
    }
  }

  // Replace any remaining rmcdn URLs by basename
  content = content.replace(/(https?:\/\/[^"'\s)>]*rmcdn[^"'\s)>]*)/g, (fullMatch) => {
    let clean = fullMatch.replace(/&amp;/g, '&').replace(/&quot;/g, '').split('?')[0];
    const b = path.basename(clean);
    if (filenameMap[b]) return filenameMap[b];
    if (filenameMap[b.toLowerCase()]) return filenameMap[b.toLowerCase()];
    const m = b.match(/(?:image|Image|RasterizedImage)-[a-f0-9-]+/i);
    if (m && filenameMap[m[0].toLowerCase()]) {
      return filenameMap[m[0].toLowerCase()];
    }
    return fullMatch;
  });

  return content;
}

function replaceLinksInSnippet(content) {
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

  linkReplacements.forEach(r => {
    content = content.replace(r.match, r.to);
  });

  return content;
}

function cleanScrollStyles(content) {
  // Extract height from article style to set data-original-height
  const heightMatch = content.match(/<article[^>]+height:\s*([0-9.]+)px/i);
  const heightVal = heightMatch ? heightMatch[1] : '800';

  // Replace overflow: hidden in article style
  content = content.replace(/<article([^>]+)style="([^"]*)"/i, (match, prefix, style) => {
    let cleanStyle = style.replace(/overflow:\s*hidden;?/gi, 'overflow: visible;');
    return `<article${prefix}data-original-height="${heightVal}" style="${cleanStyle}"`;
  });

  return content;
}

function generateDrawerHtml(currentPageFile) {
  const items = pagesConfig.map(p => {
    const isActive = p.file === currentPageFile ? ' active' : '';
    return `
      <a href="${p.file}" class="projects-drawer-item${isActive}">
        <span>${p.title.split('—')[0].trim()}</span>
        <span class="item-num">${p.tag}</span>
      </a>
    `;
  }).join('');

  return `
    <div id="projects-drawer" class="projects-drawer">
      <div class="projects-drawer-header">
        <span>Índice del Estudio (Proyectos &amp; Páginas)</span>
        <button class="projects-drawer-close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="projects-drawer-list">
        ${items}
      </div>
    </div>
  `;
}

function generatePagerHtml(currentPage) {
  if (!currentPage.isProject) return '';
  const currentProjIdx = projectsOnly.findIndex(p => p.file === currentPage.file);
  const prevProj = projectsOnly[(currentProjIdx - 1 + projectsOnly.length) % projectsOnly.length];
  const nextProj = projectsOnly[(currentProjIdx + 1) % projectsOnly.length];

  return `
    <div class="studio-pager">
      <a href="${prevProj.file}" title="Proyecto anterior: ${prevProj.title.split('—')[0].trim()}">
        <span>&larr;</span> <span>${prevProj.title.split('—')[0].trim()}</span>
      </a>
      <div class="pager-divider"></div>
      <a href="#" class="projects-toggle" title="Ver todos los proyectos">
        <span>Índice (${currentProjIdx + 1}/${projectsOnly.length})</span>
      </a>
      <div class="pager-divider"></div>
      <a href="${nextProj.file}" title="Siguiente proyecto: ${nextProj.title.split('—')[0].trim()}">
        <span>${nextProj.title.split('—')[0].trim()}</span> <span>&rarr;</span>
      </a>
    </div>
  `;
}

function generateNavHeaderHtml(currentPage) {
  return `
    <header class="studio-nav-header">
      <a href="index.html" class="studio-nav-logo" title="Terán Studio">
        <span>TERÁN STUDIO</span>
      </a>
      <nav class="studio-nav-links">
        <button class="studio-nav-link projects-toggle" type="button">Proyectos</button>
        <a href="about.html" class="studio-nav-link${currentPage.file === 'about.html' ? ' active' : ''}">About</a>
        <a href="https://www.noplan.press/" target="_blank" rel="noopener noreferrer" class="studio-nav-link">Shop</a>
        <a href="contact.html" class="studio-nav-link${currentPage.file === 'contact.html' ? ' active' : ''}">Contact</a>
      </nav>
    </header>
  `;
}

function buildPage(pageConfig) {
  const snippetPath = path.join('raw_site/snippets', `page_${pageConfig.index}_${pageConfig.path}.html`);
  let snippetContent = fs.readFileSync(snippetPath, 'utf8');

  // Process images & links & clean scroll
  snippetContent = replaceImagesInSnippet(snippetContent);
  snippetContent = replaceLinksInSnippet(snippetContent);
  snippetContent = cleanScrollStyles(snippetContent);

  const drawerHtml = generateDrawerHtml(pageConfig.file);
  const pagerHtml = generatePagerHtml(pageConfig);
  const navHeaderHtml = generateNavHeaderHtml(pageConfig);

  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${pageConfig.title}</title>
  <meta name="description" content="Clon demostrativo de alta fidelidad de Terán Studio (noplan.studio) con estilos, colores, efectos y páginas internas vinculadas.">
  <link rel="icon" href="assets/images/Favicon-39e6daeb-f233-4a04-a635-_7478052d.png" type="image/png">
  <link rel="stylesheet" href="assets/css/fonts.css">
  <link rel="stylesheet" href="assets/css/viewer.css">
  <link rel="stylesheet" href="assets/css/studio.css">
</head>
<body>
  ${navHeaderHtml}
  ${drawerHtml}

  <!-- Main Studio Canvas -->
  <main id="main-content">
    ${snippetContent}
  </main>

  ${pagerHtml}

  <!-- Back to Top Button -->
  <button class="back-to-top-btn" title="Volver arriba" aria-label="Volver arriba">&uarr;</button>

  <!-- Demonstrative Studio Badge -->
  <div class="studio-demo-badge">
    <div class="badge-dot"></div>
    <span>Terán Studio &bull; Clon Demostrativo</span>
  </div>

  <!-- Custom Letterpress Cursor -->
  <div class="custom-studio-cursor"></div>

  <script src="assets/js/studio.js"></script>
</body>
</html>`;

  fs.writeFileSync(pageConfig.file, fullHtml, 'utf8');
  console.log(`Generated ${pageConfig.file} (${fullHtml.length} bytes)`);
}

// Generate all 13 pages
console.log('Regenerating all 13 pages with scroll fixes...');
pagesConfig.forEach(p => buildPage(p));
console.log('All pages regenerated successfully!');
