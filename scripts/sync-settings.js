'use strict';

/**
 * Pushes settings groups from content/site.json into the CMS database
 * (the public site reads /api/content from the DB).
 * Use after editing the committed snapshot by hand:
 *
 *   node scripts/sync-settings.js              # all settings groups
 *   node scripts/sync-settings.js hero         # only the hero group
 *   node scripts/sync-settings.js hero projectsSection
 */

require('../lib/env').loadEnv();

const db = require('../lib/db');
const contentFile = require('../lib/contentfile');
const { DEFAULT_CONTENT } = require('../lib/content');

const args = process.argv.slice(2);
const groups = args.length ? args : Object.keys(DEFAULT_CONTENT);

db.open();

const snapshot = contentFile.readSnapshot();
if (!snapshot || !snapshot.settings) {
  console.error('content/site.json no contiene settings');
  process.exit(1);
}

let applied = 0;
let skipped = 0;
for (const group of groups) {
  if (snapshot.settings[group] === undefined) {
    console.warn(`ignorado: ${group} (no está en content/site.json)`);
    skipped += 1;
    continue;
  }
  db.setGroup(group, snapshot.settings[group]);
  applied += 1;
}
console.log(`Sincronizados ${applied} grupo(s) en ${db.DB_PATH}${skipped ? ` · ${skipped} ignorado(s)` : ''}`);
