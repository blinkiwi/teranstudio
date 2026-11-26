'use strict';

/**
 * SQLite persistence layer built on Node's built-in `node:sqlite`.
 *
 * Tables:
 *   settings        key/value JSON groups (theme, nav, hero, ...)
 *   projects        one row per stacked case study
 *   project_images  every image slot of a project, bound to its
 *                   original widget id so the layout never moves.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { GROUPS, normalizeGroup, clone } = require('./content');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'teranstudio.db');

let db = null;

function now() {
  return new Date().toISOString();
}

function open() {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      subtitle    TEXT NOT NULL DEFAULT '',
      color       TEXT NOT NULL DEFAULT '#f2eddf',
      page        TEXT NOT NULL,
      page_height INTEGER NOT NULL DEFAULT 800,
      sort        INTEGER NOT NULL DEFAULT 0,
      in_stack    INTEGER NOT NULL DEFAULT 1,
      enabled     INTEGER NOT NULL DEFAULT 1,
      footer_title TEXT NOT NULL DEFAULT '',
      info_label   TEXT NOT NULL DEFAULT 'Info',
      info_href    TEXT NOT NULL DEFAULT '',
      show_bar     INTEGER NOT NULL DEFAULT 1,
      bg_image     TEXT NOT NULL DEFAULT '',
      bg_size      TEXT NOT NULL DEFAULT 'cover',
      bg_position  TEXT NOT NULL DEFAULT 'center',
      bg_overlay   TEXT NOT NULL DEFAULT '',
      bg_overlay_opacity INTEGER NOT NULL DEFAULT 0,
      bg_fixed     INTEGER NOT NULL DEFAULT 1,
      system       INTEGER NOT NULL DEFAULT 0,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_images (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      widget_id  TEXT NOT NULL DEFAULT '',
      src        TEXT NOT NULL,
      alt        TEXT NOT NULL DEFAULT '',
      caption    TEXT NOT NULL DEFAULT '',
      position   TEXT NOT NULL DEFAULT '{}',
      sort       INTEGER NOT NULL DEFAULT 0,
      hidden     INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_images_project ON project_images (project_id, sort);
  `);

  // Lightweight migrations so an existing database keeps its content.
  const columns = table => db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  const ensureColumn = (table, name, ddl) => {
    if (!columns(table).includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  };
  ensureColumn('projects', 'footer_title', "footer_title TEXT NOT NULL DEFAULT ''");
  ensureColumn('projects', 'info_label', "info_label TEXT NOT NULL DEFAULT 'Info'");
  ensureColumn('projects', 'info_href', "info_href TEXT NOT NULL DEFAULT ''");
  ensureColumn('projects', 'show_bar', 'show_bar INTEGER NOT NULL DEFAULT 1');
  ensureColumn('projects', 'bg_image', "bg_image TEXT NOT NULL DEFAULT ''");
  ensureColumn('projects', 'bg_size', "bg_size TEXT NOT NULL DEFAULT 'cover'");
  ensureColumn('projects', 'bg_position', "bg_position TEXT NOT NULL DEFAULT 'center'");
  ensureColumn('projects', 'bg_overlay', "bg_overlay TEXT NOT NULL DEFAULT ''");
  ensureColumn('projects', 'bg_overlay_opacity', 'bg_overlay_opacity INTEGER NOT NULL DEFAULT 0');
  ensureColumn('projects', 'bg_fixed', 'bg_fixed INTEGER NOT NULL DEFAULT 1');
  ensureColumn('projects', 'system', 'system INTEGER NOT NULL DEFAULT 0');
  ensureColumn('project_images', 'hidden', 'hidden INTEGER NOT NULL DEFAULT 0');

  return db;
}

/* ── Settings ─────────────────────────────────────────────── */

function getGroups() {
  const rows = open().prepare('SELECT key, value FROM settings').all();
  const stored = {};
  for (const row of rows) {
    try {
      stored[row.key] = JSON.parse(row.value);
    } catch (_) {
      stored[row.key] = null;
    }
  }

  const out = {};
  for (const group of GROUPS) out[group] = normalizeGroup(group, stored[group]);
  return out;
}

function setGroup(group, value) {
  if (!GROUPS.includes(group)) throw new Error(`Unknown settings group: ${group}`);
  const normalized = normalizeGroup(group, value);
  open()
    .prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `)
    .run(group, JSON.stringify(normalized), now());
  return normalized;
}

function settingsCount() {
  return open().prepare('SELECT COUNT(*) AS c FROM settings').get().c;
}

/* ── Projects ─────────────────────────────────────────────── */

function rowToProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    color: row.color,
    page: row.page,
    pageHeight: row.page_height,
    sort: row.sort,
    inStack: !!row.in_stack,
    enabled: !!row.enabled,
    // Bottom bar shown at the end of every project page.
    footerTitle: row.footer_title || '',
    infoLabel: row.info_label === undefined || row.info_label === null ? 'Info' : row.info_label,
    infoHref: row.info_href || '',
    showBar: row.show_bar === undefined ? true : !!row.show_bar,
    // Full-page background image (persists through the sheet scroll).
    bgImage: row.bg_image || '',
    bgSize: row.bg_size || 'cover',
    bgPosition: row.bg_position || 'center',
    bgOverlay: row.bg_overlay || '',
    bgOverlayOpacity: row.bg_overlay_opacity === undefined ? 0 : Number(row.bg_overlay_opacity),
    bgFixed: row.bg_fixed === undefined ? true : !!row.bg_fixed,
    system: !!row.system
  };
}

function listProjects({ includeDisabled = false, stackOnly = false, includeSystem = false } = {}) {
  const clauses = [];
  if (!includeDisabled) clauses.push('enabled = 1');
  if (stackOnly) clauses.push('in_stack = 1');
  if (!includeSystem) clauses.push('system = 0');
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  return open().prepare(`SELECT * FROM projects${where} ORDER BY sort, id`).all().map(rowToProject);
}

/** Virtual project that owns the fixed images of the home canvas. */
function getHomeProject() {
  return rowToProject(
    open().prepare("SELECT * FROM projects WHERE system = 1 AND page = 'index.html' LIMIT 1").get()
  );
}

function getProject(idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const row = isNumeric
    ? open().prepare('SELECT * FROM projects WHERE id = ?').get(Number(idOrSlug))
    : open().prepare('SELECT * FROM projects WHERE slug = ?').get(String(idOrSlug));
  return rowToProject(row);
}

function createProject(data) {
  const sort = Number.isFinite(data.sort)
    ? data.sort
    : (open().prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM projects').get().n);

  const info = open()
    .prepare(`
      INSERT INTO projects
        (slug, title, subtitle, color, page, page_height, sort, in_stack, enabled,
         footer_title, info_label, info_href, show_bar,
         bg_image, bg_size, bg_position, bg_overlay, bg_overlay_opacity, bg_fixed,
         system, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.slug,
      data.title,
      data.subtitle || '',
      data.color || '#f2eddf',
      data.page || `${data.slug}.html`,
      Number(data.pageHeight) || 800,
      sort,
      data.inStack === false ? 0 : 1,
      data.enabled === false ? 0 : 1,
      data.footerTitle || '',
      data.infoLabel === undefined ? 'Info' : data.infoLabel,
      data.infoHref || '',
      data.showBar === false ? 0 : 1,
      data.bgImage || '',
      data.bgSize || 'cover',
      data.bgPosition || 'center',
      data.bgOverlay || '',
      Number(data.bgOverlayOpacity) || 0,
      data.bgFixed === false ? 0 : 1,
      data.system ? 1 : 0,
      now()
    );

  return getProject(info.lastInsertRowid);
}

function updateProject(id, data) {
  const current = getProject(id);
  if (!current) return null;

  if (current.system) {
    // The home pseudo-project only manages the fixed canvas images: its
    // route and status must stay stable whatever the panel sends.
    data = {
      ...data,
      slug: current.slug,
      page: current.page,
      pageHeight: current.pageHeight,
      inStack: false,
      enabled: true
    };
  }

  open()
    .prepare(`
      UPDATE projects
         SET slug = ?, title = ?, subtitle = ?, color = ?, page = ?,
             page_height = ?, sort = ?, in_stack = ?, enabled = ?,
             footer_title = ?, info_label = ?, info_href = ?, show_bar = ?,
             bg_image = ?, bg_size = ?, bg_position = ?, bg_overlay = ?,
             bg_overlay_opacity = ?, bg_fixed = ?, updated_at = ?
       WHERE id = ?
    `)
    .run(
      data.slug !== undefined ? data.slug : current.slug,
      data.title !== undefined ? data.title : current.title,
      data.subtitle !== undefined ? data.subtitle : current.subtitle,
      data.color !== undefined ? data.color : current.color,
      data.page !== undefined ? data.page : current.page,
      data.pageHeight !== undefined ? Number(data.pageHeight) : current.pageHeight,
      data.sort !== undefined ? Number(data.sort) : current.sort,
      data.inStack !== undefined ? (data.inStack ? 1 : 0) : (current.inStack ? 1 : 0),
      data.enabled !== undefined ? (data.enabled ? 1 : 0) : (current.enabled ? 1 : 0),
      data.footerTitle !== undefined ? data.footerTitle : current.footerTitle,
      data.infoLabel !== undefined ? data.infoLabel : current.infoLabel,
      data.infoHref !== undefined ? data.infoHref : current.infoHref,
      data.showBar !== undefined ? (data.showBar ? 1 : 0) : (current.showBar ? 1 : 0),
      data.bgImage !== undefined ? data.bgImage : current.bgImage,
      data.bgSize !== undefined ? data.bgSize : current.bgSize,
      data.bgPosition !== undefined ? data.bgPosition : current.bgPosition,
      data.bgOverlay !== undefined ? data.bgOverlay : current.bgOverlay,
      data.bgOverlayOpacity !== undefined ? Number(data.bgOverlayOpacity) : current.bgOverlayOpacity,
      data.bgFixed !== undefined ? (data.bgFixed ? 1 : 0) : (current.bgFixed ? 1 : 0),
      now(),
      current.id
    );

  return getProject(current.id);
}

function deleteProject(id) {
  const info = open().prepare('DELETE FROM projects WHERE id = ?').run(Number(id));
  return info.changes > 0;
}

function reorderProjects(ids) {
  const stmt = open().prepare('UPDATE projects SET sort = ?, updated_at = ? WHERE id = ?');
  ids.forEach((id, index) => stmt.run(index, now(), Number(id)));
  return listProjects({ includeDisabled: true });
}

/* ── Project images ───────────────────────────────────────── */

function rowToImage(row) {
  let position = {};
  try {
    position = JSON.parse(row.position || '{}');
  } catch (_) {
    position = {};
  }
  return {
    id: row.id,
    projectId: row.project_id,
    widgetId: row.widget_id,
    src: row.src,
    alt: row.alt,
    caption: row.caption,
    position,
    sort: row.sort,
    hidden: !!row.hidden
  };
}

function listImages(projectId, { includeHidden = false } = {}) {
  const where = includeHidden
    ? 'project_id = ?'
    : 'project_id = ? AND hidden = 0';
  return open()
    .prepare(`SELECT * FROM project_images WHERE ${where} ORDER BY sort, id`)
    .all(Number(projectId))
    .map(rowToImage);
}

function listHiddenImages(projectId) {
  return listImages(projectId, { includeHidden: true }).filter(image => image.hidden);
}

function hiddenWidgetIds(projectId) {
  return listHiddenImages(projectId)
    .map(image => image.widgetId)
    .filter(Boolean);
}

function getImage(id) {
  return rowToImage(open().prepare('SELECT * FROM project_images WHERE id = ?').get(Number(id)));
}

function createImage(projectId, data) {
  const sort = Number.isFinite(data.sort)
    ? data.sort
    : open()
        .prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM project_images WHERE project_id = ?')
        .get(Number(projectId)).n;

  const info = open()
    .prepare(`
      INSERT INTO project_images (project_id, widget_id, src, alt, caption, position, sort, hidden, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      Number(projectId),
      data.widgetId || '',
      data.src,
      data.alt || '',
      data.caption || '',
      JSON.stringify(data.position || {}),
      sort,
      data.hidden ? 1 : 0,
      now()
    );

  return getImage(info.lastInsertRowid);
}

function updateImage(id, data) {
  const current = getImage(id);
  if (!current) return null;

  open()
    .prepare(`
      UPDATE project_images
         SET widget_id = ?, src = ?, alt = ?, caption = ?, position = ?, sort = ?, hidden = ?, updated_at = ?
       WHERE id = ?
    `)
    .run(
      data.widgetId !== undefined ? data.widgetId : current.widgetId,
      data.src !== undefined ? data.src : current.src,
      data.alt !== undefined ? data.alt : current.alt,
      data.caption !== undefined ? data.caption : current.caption,
      JSON.stringify(data.position !== undefined ? data.position : current.position),
      data.sort !== undefined ? Number(data.sort) : current.sort,
      data.hidden !== undefined ? (data.hidden ? 1 : 0) : (current.hidden ? 1 : 0),
      now(),
      current.id
    );

  return getImage(current.id);
}

function hideImage(id) {
  const info = open()
    .prepare('UPDATE project_images SET hidden = 1, updated_at = ? WHERE id = ?')
    .run(now(), Number(id));
  return info.changes > 0;
}

function restoreImage(id) {
  const info = open()
    .prepare('UPDATE project_images SET hidden = 0, updated_at = ? WHERE id = ?')
    .run(now(), Number(id));
  return info.changes > 0;
}

/* Hard remove: used by the orphan-image cleanup, not by the panel. */
function deleteImage(id) {
  const info = open().prepare('DELETE FROM project_images WHERE id = ?').run(Number(id));
  return info.changes > 0;
}

function reorderImages(ids) {
  const stmt = open().prepare('UPDATE project_images SET sort = ?, updated_at = ? WHERE id = ?');
  ids.forEach((id, index) => stmt.run(index, now(), Number(id)));
  return true;
}

/* ── Public payload ───────────────────────────────────────── */

function getProjectWithImages(idOrSlug) {
  const project = getProject(idOrSlug);
  if (!project) return null;
  return {
    ...project,
    images: listImages(project.id),
    hiddenWidgets: hiddenWidgetIds(project.id)
  };
}

function publicContent({ includeDrafts = false } = {}) {
  const groups = getGroups();
  const manageHome = groups.site.manageHomeImages !== false;
  const homeProject = manageHome ? getHomeProject() : null;
  const home = homeProject
    ? { images: listImages(homeProject.id), hiddenWidgets: hiddenWidgetIds(homeProject.id) }
    : null;
  const projects = listProjects({
    includeDisabled: includeDrafts,
    includeSystem: includeDrafts && manageHome
  }).map(project => ({
    ...project,
    images: listImages(project.id),
    hiddenWidgets: hiddenWidgetIds(project.id),
    ...(includeDrafts ? { hiddenImages: listHiddenImages(project.id) } : {})
  }));

  return {
    site: groups.site,
    theme: groups.theme,
    sizes: groups.sizes,
    nav: groups.nav,
    hero: groups.hero,
    projectsSection: groups.projectsSection,
    footer: groups.footer,
    blocks: groups.blocks,
    home,
    projects,
    cacheVersion: groups.cache ? groups.cache.version : 0,
    updatedAt: now()
  };
}

/* ── Cache version (used for asset ETags) ─────────────────── */

function getCacheVersion() {
  const groups = getGroups();
  return (groups.cache && Number(groups.cache.version)) || 0;
}

function bumpCacheVersion() {
  const next = getCacheVersion() + 1;
  setGroup('cache', { version: next });
  return next;
}

/** Finds the project that owns a given HTML file (e.g. "lost-sock.html"). */
function getProjectByPage(page) {
  if (!page) return null;
  const row = open().prepare('SELECT * FROM projects WHERE page = ?').get(String(page));
  return rowToProject(row);
}

function isSeeded() {
  return settingsCount() > 0 && open().prepare('SELECT COUNT(*) AS c FROM projects').get().c > 0;
}

function replaceAllSettings(groups) {
  const stmt = open().prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  for (const group of GROUPS) {
    stmt.run(group, JSON.stringify(normalizeGroup(group, groups[group])), now());
  }
}

function clearAll() {
  open().exec('DELETE FROM project_images; DELETE FROM projects; DELETE FROM settings;');
}

module.exports = {
  open,
  DB_PATH,
  getGroups,
  setGroup,
  settingsCount,
  listProjects,
  getProject,
  getHomeProject,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  listImages,
  getImage,
  createImage,
  updateImage,
  hideImage,
  restoreImage,
  deleteImage,
  listHiddenImages,
  hiddenWidgetIds,
  reorderImages,
  getProjectWithImages,
  getProjectByPage,
  publicContent,
  getCacheVersion,
  bumpCacheVersion,
  isSeeded,
  replaceAllSettings,
  clearAll,
  clone
};
