'use strict';

/**
 * Rebuilds the CMS database from the static site.
 *
 *   node scripts/cms-seed.js           # seeds only if empty
 *   node scripts/cms-seed.js --reset   # wipes and reseeds everything
 */

require('../lib/env').loadEnv();

const db = require('../lib/db');
const { seed } = require('../lib/seed');

const reset = process.argv.includes('--reset');

const result = seed({ reset });

console.log(`Base de datos: ${db.DB_PATH}`);
console.log(`Origen: ${result.source === 'content/site.json' ? 'content/site.json' : 'valores por defecto + HTML estático'}`);
console.log(`Proyectos: ${result.projects}`);
console.log(`Imágenes: ${result.images}`);
