'use strict';

/**
 * Seeds the database from the original static site.
 *
 * Projects come from the known case-study list; their images are parsed
 * from the Readymag markup so every image slot keeps the exact position
 * it had in the export (the CMS only ever swaps the `src`).
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
const contentFile = require('./contentfile');
const { DEFAULT_CONTENT } = require('./content');

const ROOT = path.join(__dirname, '..');

const PROJECT_SEEDS = [
  { slug: 'lost-sock',          title: 'Lost Sock Roasters', subtitle: 'Branding & Coffee',        color: '#93bbc9', pageHeight: 4974, inStack: true },
  { slug: 'motorkat',           title: 'Motorkat',           subtitle: 'Wood Grill & Raw Bar',     color: '#414106', pageHeight: 5488, inStack: true },
  { slug: 'zinnia',             title: 'Zinnia',             subtitle: 'Multi-Restaurant Concept', color: '#f6f3eb', pageHeight: 7030, inStack: true },
  { slug: 'peoples-book',       title: 'People’s Book',      subtitle: 'Bookstore Identity',       color: '#f7de59', pageHeight: 4396, inStack: true },
  { slug: 'soko',               title: 'SOKO',               subtitle: 'Butcher Shop & Deli',      color: '#ebebeb', pageHeight: 5557, inStack: true },
  { slug: 'indigro',            title: 'Indigro',            subtitle: 'Houseplant Studio',        color: '#ed718d', pageHeight: 3779, inStack: true },
  { slug: 'atlantic-rhythms-1', title: 'Goodnight Shiva',    subtitle: 'Cassette J-Card',          color: '#e4decb', pageHeight: 1310, inStack: true },
  { slug: 'atlantic-rhythms-2', title: 'Miru Mira',          subtitle: 'Cassette J-Card',          color: '#f75f23', pageHeight: 1429, inStack: true },
  { slug: 'no-way',             title: 'No Way',             subtitle: '2,100 sq ft Mural',        color: '#faf0e8', pageHeight: 6600, inStack: true },
  { slug: 'abcdc',              title: 'ABCDC',              subtitle: 'Cherry Blossom Sculpture', color: '#212121', pageHeight: 1841, inStack: true },
  { slug: 'about',              title: 'About',              subtitle: 'About Studio',             color: '#f2eddf', pageHeight: 800,  inStack: false },
  { slug: 'contact',            title: 'Contact',            subtitle: 'Get In Touch',             color: '#f2eddf', pageHeight: 800,  inStack: false }
];

const WIDGET_RE = /<div class="rmwidget widget-picture[^"]*"[^>]*data-id="([^"]+)"[^>]*>/g;

/* Reads a standalone CSS property. The boundary avoids matching
   `margin-left` when looking for `left`, or `margin-top` for `top`. */
function readPx(style, prop) {
  const match = String(style || '').match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i'));
  return match ? match[1].trim() : '';
}

function parsePosition(style) {
  const top = readPx(style, 'top');
  const topPx = /px$/i.test(top) ? parseFloat(top) : NaN;
  return {
    left: readPx(style, 'left'),
    top,
    width: readPx(style, 'width'),
    height: readPx(style, 'height'),
    zIndex: readPx(style, 'z-index'),
    zoom: readPx(style, 'zoom'),
    transform: readPx(style, 'transform'),
    // Top-of-page chrome (logo, menu icons) that embeds.js hides inside
    // the stacked view. Kept so the admin can filter it out.
    chrome: Number.isFinite(topPx) && topPx >= -10 && topPx <= 140
  };
}

function readAttr(attrs, name) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match ? match[1] : '';
}

function parseImages(html) {
  const images = [];
  const opens = Array.from(html.matchAll(WIDGET_RE));

  for (let i = 0; i < opens.length; i++) {
    const open = opens[i];
    const start = open.index + open[0].length;
    // A widget may hold a `.bgpic` div before its <img>, so scan the
    // whole block up to the next widget instead of expecting the image
    // immediately after the opening tag.
    const end = i + 1 < opens.length ? opens[i + 1].index : html.length;
    const block = html.slice(start, end);

    const imgMatch = block.match(/<img([^>]*)>/);
    let src = imgMatch ? readAttr(imgMatch[1], 'src') : '';
    if (!src) {
      const bg = block.match(/<div class="bgpic"[^>]*url="([^"]+)"/);
      if (bg) src = bg[1];
    }
    if (!src) continue;

    const styleMatch = open[0].match(/style="([^"]*)"/);

    images.push({
      widgetId: open[1],
      src,
      alt: imgMatch ? readAttr(imgMatch[1], 'alt') : '',
      caption: '',
      position: parsePosition(styleMatch ? styleMatch[1] : '')
    });
  }

  return images;
}

/**
 * The home canvas has images but no page of its own in the projects list:
 * a virtual "Inicio" project owns them so the panel can edit them with the
 * same image manager as any other page.
 */
function ensureHomeProject() {
  if (db.getHomeProject()) return null;

  let slug = 'inicio';
  let suffix = 1;
  while (db.getProject(slug)) slug = `inicio-${++suffix}`;

  return db.createProject({
    slug,
    title: 'Inicio',
    subtitle: 'Imágenes fijas de la portada',
    color: '#f2eddf',
    page: 'index.html',
    pageHeight: 800,
    sort: 999,
    inStack: false,
    enabled: true,
    showBar: false,
    system: true
  });
}

/**
 * Removes image rows whose widgetId does not exist in the project's page.
 * Old snapshots contained pictures from the previous index export, which
 * used to fall back to a positional slot and overwrite real images.
 */
function pruneOrphanImages() {
  let removed = 0;

  for (const project of db.listProjects({ includeDisabled: true, includeSystem: true })) {
    if (!project.page) continue;
    const file = path.join(ROOT, project.page);
    if (!fs.existsSync(file)) continue;

    const html = fs.readFileSync(file, 'utf8');
    const ids = new Set(Array.from(html.matchAll(WIDGET_RE)).map(match => match[1]));

    for (const image of db.listImages(project.id, { includeHidden: true })) {
      if (image.widgetId && !ids.has(image.widgetId)) {
        db.deleteImage(image.id);
        removed += 1;
      }
    }
  }

  return removed;
}

/**
 * Makes sure every picture widget of a page has a row in the panel, and
 * that the row order follows the page order. Older snapshots were missing
 * some slots, so the backend list and the rendered page disagreed.
 */
function reconcileProjectImages() {
  let added = 0;
  let reordered = 0;

  for (const project of db.listProjects({ includeDisabled: true, includeSystem: true })) {
    if (!project.page) continue;
    const file = path.join(ROOT, project.page);
    if (!fs.existsSync(file)) continue;

    const parsed = parseImages(fs.readFileSync(file, 'utf8'));
    const rows = db.listImages(project.id, { includeHidden: true });
    const byWidget = new Map(rows.filter(row => row.widgetId).map(row => [row.widgetId, row]));

    parsed.forEach((image, index) => {
      const existing = byWidget.get(image.widgetId);

      if (!existing) {
        db.createImage(project.id, { ...image, sort: index });
        added += 1;
        return;
      }

      if (existing.sort !== index) {
        db.updateImage(existing.id, { sort: index });
        reordered += 1;
      }
    });
  }

  return { added, reordered };
}

function seed({ reset = false } = {}) {
  db.open();

  if (reset) db.clearAll();

  // A committed snapshot (content/site.json) is the source of truth:
  // it carries every panel change, so a fresh clone restores the site.
  if (db.listProjects({ includeDisabled: true, includeSystem: true }).length === 0) {
    const snapshot = contentFile.readSnapshot();
    if (snapshot) {
      const imported = contentFile.importSnapshot(snapshot);
      return {
        source: 'content/site.json',
        projects: imported.projects,
        images: imported.images
      };
    }
  }

  if (!db.settingsCount()) db.replaceAllSettings(DEFAULT_CONTENT);

  if (db.listProjects({ includeDisabled: true, includeSystem: true }).length === 0) {
    PROJECT_SEEDS.forEach((seedProject, index) => {
      const project = db.createProject({
        ...seedProject,
        page: `${seedProject.slug}.html`,
        sort: index
      });

      const file = path.join(ROOT, `${seedProject.slug}.html`);
      if (!fs.existsSync(file)) return;

      const html = fs.readFileSync(file, 'utf8');
      const images = parseImages(html);
      images.forEach((image, imageIndex) => {
        db.createImage(project.id, { ...image, sort: imageIndex });
      });
    });
  }

  return {
    source: 'defaults',
    projects: db.listProjects({ includeDisabled: true, includeSystem: true }).length,
    images: db.open().prepare('SELECT COUNT(*) AS c FROM project_images').get().c
  };
}

function seedIfEmpty() {
  if (db.isSeeded()) return { seeded: false };
  const result = seed();
  return { seeded: true, ...result };
}

module.exports = { seed, seedIfEmpty, parseImages, pruneOrphanImages, reconcileProjectImages, ensureHomeProject, PROJECT_SEEDS };
