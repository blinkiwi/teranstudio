'use strict';

/**
 * Writes the panel content to content/site.json.
 *
 * The server does this automatically after every save, so this script is
 * only needed to refresh the file by hand.
 */

require('../lib/env').loadEnv();

const contentFile = require('../lib/contentfile');
const db = require('../lib/db');

const snapshot = contentFile.exportContent();

console.log(`Escrito: ${contentFile.CONTENT_FILE}`);
console.log(`Proyectos: ${snapshot.projects.length}`);
console.log(`Imágenes: ${snapshot.projects.reduce((total, p) => total + p.images.length, 0)}`);
console.log(`Base de datos: ${db.DB_PATH}`);
