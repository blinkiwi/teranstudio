'use strict';

/**
 * JSON snapshot of the panel content.
 *
 * The SQLite database is local (and git-ignored), so everything the
 * editor changes — texts, colours, projects, images, positions — is
 * mirrored into `content/site.json`, which is committed. A fresh clone
 * seeds itself from that file.
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const CONTENT_FILE = path.join(CONTENT_DIR, 'site.json');
const FORMAT_VERSION = 1;

/* ── Export ───────────────────────────────────────────────── */

function buildSnapshot() {
  const groups = db.getGroups();

  const projects = db.listProjects({ includeDisabled: true, includeSystem: true }).map(project => ({
    slug: project.slug,
    title: project.title,
    subtitle: project.subtitle,
    color: project.color,
    page: project.page,
    pageHeight: project.pageHeight,
    sort: project.sort,
    inStack: project.inStack,
    enabled: project.enabled,
    footerTitle: project.footerTitle,
    infoLabel: project.infoLabel,
    infoHref: project.infoHref,
    showBar: project.showBar,
    bgImage: project.bgImage,
    bgSize: project.bgSize,
    bgPosition: project.bgPosition,
    bgOverlay: project.bgOverlay,
    bgOverlayOpacity: project.bgOverlayOpacity,
    bgFixed: project.bgFixed,
    system: !!project.system,
    images: db.listImages(project.id, { includeHidden: true }).map(image => ({
      widgetId: image.widgetId,
      src: image.src,
      alt: image.alt,
      caption: image.caption,
      position: image.position,
      sort: image.sort,
      hidden: !!image.hidden
    }))
  }));

  return {
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    settings: groups,
    projects
  };
}

function exportContent() {
  const snapshot = buildSnapshot();
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  return snapshot;
}

/* ── Import ───────────────────────────────────────────────── */

function readSnapshot() {
  try {
    const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (!data.settings || !Array.isArray(data.projects)) return null;
    return data;
  } catch (_) {
    return null;
  }
}

/** Writes a snapshot into the database. Assumes the tables are empty. */
function importSnapshot(snapshot) {
  if (!snapshot) return { projects: 0, images: 0 };

  db.replaceAllSettings(snapshot.settings);

  let images = 0;
  snapshot.projects.forEach((project, index) => {
    const created = db.createProject({
      slug: project.slug,
      title: project.title,
      subtitle: project.subtitle,
      color: project.color,
      page: project.page,
      pageHeight: project.pageHeight,
      sort: Number.isFinite(project.sort) ? project.sort : index,
      inStack: project.inStack !== false,
      enabled: project.enabled !== false,
      footerTitle: project.footerTitle,
      infoLabel: project.infoLabel,
      infoHref: project.infoHref,
      showBar: project.showBar !== false,
      bgImage: project.bgImage || '',
      bgSize: project.bgSize || 'cover',
      bgPosition: project.bgPosition || 'center',
      bgOverlay: project.bgOverlay || '',
      bgOverlayOpacity: Number(project.bgOverlayOpacity) || 0,
      bgFixed: project.bgFixed !== false,
      system: project.system === true
    });

    (project.images || []).forEach((image, imageIndex) => {
      if (!image || !image.src) return;
      db.createImage(created.id, {
        widgetId: image.widgetId,
        src: image.src,
        alt: image.alt,
        caption: image.caption,
        position: image.position,
        sort: Number.isFinite(image.sort) ? image.sort : imageIndex,
        hidden: image.hidden === true
      });
      images++;
    });
  });

  return { projects: snapshot.projects.length, images };
}

module.exports = {
  CONTENT_FILE,
  FORMAT_VERSION,
  buildSnapshot,
  exportContent,
  readSnapshot,
  importSnapshot
};
