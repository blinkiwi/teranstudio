'use strict';

/**
 * Terán Studio — full stack server.
 *
 * Zero npm dependencies:
 *   · static file serving for the public site
 *   · JSON API for the CMS
 *   · raw image uploads
 *   · single-token authentication for the /admin panel
 *
 * Start with:  npm start   (or: node --no-warnings server.js)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const env = require('./lib/env');
env.loadEnv();

const db = require('./lib/db');
const contentFile = require('./lib/contentfile');
const { seedIfEmpty, pruneOrphanImages, reconcileProjectImages, ensureHomeProject, parseImages } = require('./lib/seed');
const auth = require('./lib/auth');
const { GROUPS } = require('./lib/content');

const PORT = Number(process.env.PORT) || 3000;
const BASE_DIR = __dirname;
const ADMIN_DIR = path.join(BASE_DIR, 'admin');
const UPLOAD_DIR = path.join(BASE_DIR, 'assets', 'uploads');

// Bumped by the “clear cache” action; every asset ETag includes it so
// clients that revalidate always pick up the newest files.
let CACHE_VERSION = 0;

const MAX_BODY = 2 * 1024 * 1024;              // 2 MB of JSON
const MAX_UPLOAD = 25 * 1024 * 1024;           // 25 MB per image
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

/* ── Small helpers ────────────────────────────────────────── */

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(text);
}

function readBody(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const buffer = await readBody(req);
  if (!buffer.length) return {};
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch (_) {
    throw Object.assign(new Error('JSON inválido'), { status: 400 });
  }
}

function safeJoin(base, target) {
  const resolved = path.join(base, decodeURIComponent(target));
  return resolved.startsWith(base) ? resolved : null;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sanitizeFilename(name) {
  const base = path.basename(String(name || '')).replace(/[^a-zA-Z0-9._-]/g, '-');
  return base.replace(/^\.+/, '').slice(0, 120) || `imagen-${Date.now()}.png`;
}

/* ── Static files ─────────────────────────────────────────── */

function serveStatic(req, res, pathname) {
  let urlPath = pathname;

  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  } else if (urlPath === '/admin' || urlPath === '/admin/') {
    urlPath = '/admin/index.html';
  } else if (!path.extname(urlPath)) {
    if (fs.existsSync(path.join(BASE_DIR, `${urlPath}.html`))) urlPath += '.html';
  }

  const filePath = safeJoin(BASE_DIR, urlPath);
  if (!filePath) return sendText(res, 403, '403 Forbidden');

  // Draft projects are not published: their page is not reachable either.
  if (path.extname(filePath).toLowerCase() === '.html') {
    const project = db.getProjectByPage(path.basename(filePath));
    if (project && !project.enabled) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Borrador — ${escapeHtml(project.title)}</title></head>
<body style="background:#f2eddf;font-family:sans-serif;padding:40px;text-align:center;">
<h1>Borrador</h1>
<p>El proyecto «${escapeHtml(project.title)}» está en borrador y no está publicado.</p>
<p><a href="/index.html" style="color:#d84315;font-weight:bold;">&larr; Volver al Inicio</a></p>
</body></html>`);
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>404 — Terán Studio</title></head>
<body style="background:#f2eddf;font-family:sans-serif;padding:40px;text-align:center;">
<h1>404 — Página no encontrada</h1>
<p>No encontramos el recurso solicitado.</p>
<p><a href="/index.html" style="color:#d84315;font-weight:bold;">&larr; Volver al Inicio</a></p>
</body></html>`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isUpload = filePath.startsWith(UPLOAD_DIR);

    // The ETag carries the cache version: after “clear cache” every
    // revalidating client gets a new tag and re-downloads the file.
    const etag = `W/"${stats.size}-${Math.round(stats.mtimeMs)}-${CACHE_VERSION}"`;
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': isUpload ? 'public, max-age=31536000, immutable' : 'no-cache',
      'ETag': etag,
      'X-Cache-Version': String(CACHE_VERSION)
    };

    const inm = req.headers['if-none-match'];
    if (inm && inm.split(',').some(tag => tag.trim() === etag)) {
      res.writeHead(304, headers);
      return res.end();
    }

    headers['Content-Length'] = stats.size;
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ── API ──────────────────────────────────────────────────── */

function tokenInfo() {
  const token = auth.adminToken();
  return {
    configured: Boolean(token),
    length: token.length,
    preview: token ? `${token.slice(0, 4)}…${token.slice(-4)}` : ''
  };
}

const TOKEN_MIN_LENGTH = 16;
const TOKEN_MAX_LENGTH = 256;

/* The block editor stores the inner HTML of text widgets. It is only fed
   by the authenticated panel, but strip anything executable so a saved
   block can never inject scripts into the public site. */
function sanitizeBlockHtml(value) {
  return String(value == null ? '' : value)
    .slice(0, 40000)
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi, '$1="#"');
}

function cleanText(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

/** Keeps the blocks group small, predictable and free of markup hazards. */
function sanitizeBlocks(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output = {};

  for (const [pageKey, page] of Object.entries(input)) {
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(pageKey)) continue;
    if (!page || typeof page !== 'object' || Array.isArray(page)) continue;

    const cleanPage = {};

    for (const [blockId, override] of Object.entries(page)) {
      if (!override || typeof override !== 'object' || Array.isArray(override)) continue;

      if (blockId === 'meta') {
        const meta = {};
        if (override.title !== undefined) meta.title = cleanText(override.title, 200);
        if (override.description !== undefined) meta.description = cleanText(override.description, 500);
        if (Object.keys(meta).length) cleanPage.meta = meta;
        continue;
      }

      if (!/^[A-Za-z0-9_-]{1,64}$/.test(blockId)) continue;

      const clean = {};
      if (typeof override.html === 'string') clean.html = sanitizeBlockHtml(override.html);
      if (typeof override.label === 'string') clean.label = cleanText(override.label, 300);
      if (typeof override.src === 'string') clean.src = cleanText(override.src, 600);
      if (typeof override.alt === 'string') clean.alt = cleanText(override.alt, 300);
      if (typeof override.href === 'string') {
        const href = cleanText(override.href, 600);
        clean.href = /^\s*javascript:/i.test(href) ? '' : href;
      }
      if (override.hidden === true) clean.hidden = true;

      if (Object.keys(clean).length) cleanPage[blockId] = clean;
    }

    if (Object.keys(cleanPage).length) output[pageKey] = cleanPage;
  }

  return output;
}

async function handleApi(req, res, url) {
  const { pathname } = url;
  const method = req.method.toUpperCase();
  const requireAuth = () => {
    if (auth.isAuthenticated(req)) return true;
    sendJson(res, 401, { error: 'No autorizado' });
    return false;
  };

  /* Session */
  if (pathname === '/api/login' && method === 'POST') {
    const body = await readJson(req);
    if (!auth.adminToken()) {
      return sendJson(res, 500, { error: 'ADMIN_TOKEN no configurado en el servidor' });
    }
    if (!auth.verifyToken(body.token)) {
      return sendJson(res, 401, { error: 'Token incorrecto' });
    }
    const id = auth.createSession();
    res.setHeader('Set-Cookie', auth.sessionCookie(id));
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/logout' && method === 'POST') {
    auth.destroySession(auth.sessionIdFromRequest(req));
    res.setHeader('Set-Cookie', auth.clearCookie());
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/session' && method === 'GET') {
    return sendJson(res, 200, { authenticated: auth.isAuthenticated(req) });
  }

  /* Admin token: read status and rotate it from the panel. */
  if (pathname === '/api/admin/token' && method === 'GET') {
    if (!requireAuth()) return;
    return sendJson(res, 200, tokenInfo());
  }

  if (pathname === '/api/admin/token' && (method === 'PUT' || method === 'PATCH')) {
    if (!requireAuth()) return;
    const body = await readJson(req);

    const currentToken = String(body.currentToken || '');
    const newToken = String(body.newToken || '').trim();
    const confirmToken = body.confirmToken === undefined ? newToken : String(body.confirmToken);

    if (!currentToken || !auth.verifyToken(currentToken)) {
      return sendJson(res, 401, { error: 'El token actual no es correcto' });
    }
    if (newToken.length < TOKEN_MIN_LENGTH) {
      return sendJson(res, 400, { error: `El nuevo token debe tener al menos ${TOKEN_MIN_LENGTH} caracteres` });
    }
    if (newToken.length > TOKEN_MAX_LENGTH) {
      return sendJson(res, 400, { error: `El nuevo token no puede superar ${TOKEN_MAX_LENGTH} caracteres` });
    }
    if (/\s/.test(newToken)) {
      return sendJson(res, 400, { error: 'El nuevo token no puede contener espacios' });
    }
    if (newToken !== confirmToken) {
      return sendJson(res, 400, { error: 'Los tokens nuevos no coinciden' });
    }
    if (newToken === auth.adminToken()) {
      return sendJson(res, 400, { error: 'El nuevo token debe ser distinto del actual' });
    }

    try {
      env.setEnvVar('ADMIN_TOKEN', newToken);
    } catch (error) {
      return sendJson(res, 500, { error: `No se pudo escribir .env: ${error.message}` });
    }

    auth.setAdminToken(newToken);
    auth.destroyOtherSessions(auth.sessionIdFromRequest(req));
    return sendJson(res, 200, { ok: true, token: tokenInfo() });
  }

  /* Public content (published projects only) */
  if (pathname === '/api/content' && method === 'GET') {
    return sendJson(res, 200, db.publicContent());
  }

  /* Panel content: also returns drafts so they can be edited. */
  if (pathname === '/api/admin/content' && method === 'GET') {
    if (!requireAuth()) return;
    return sendJson(res, 200, db.publicContent({ includeDrafts: true }));
  }

  let match = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (match && method === 'GET') {
    const project = db.getProjectWithImages(match[1]);
    if (!project) return sendJson(res, 404, { error: 'Proyecto no encontrado' });
    return sendJson(res, 200, project);
  }

  if (pathname === '/api/cache/clear' && method === 'POST') {
    if (!requireAuth()) return;
    CACHE_VERSION = db.bumpCacheVersion();
    return sendJson(res, 200, { ok: true, version: CACHE_VERSION });
  }

  if (pathname === '/api/media' && method === 'GET') {
    if (!requireAuth()) return;
    let files = [];
    try {
      files = fs.readdirSync(UPLOAD_DIR)
        .filter(name => IMAGE_EXT.has(path.extname(name).toLowerCase()))
        .map(name => ({ name, url: `assets/uploads/${name}` }));
    } catch (_) {
      files = [];
    }
    return sendJson(res, 200, { files });
  }

  /* Uploads (raw body → file) */
  if (pathname === '/api/upload' && (method === 'PUT' || method === 'POST')) {
    if (!requireAuth()) return;

    const rawName = url.searchParams.get('name') || `imagen-${Date.now()}.png`;
    const filename = sanitizeFilename(rawName);
    const ext = path.extname(filename).toLowerCase();
    if (!IMAGE_EXT.has(ext)) {
      return sendJson(res, 400, { error: `Extensión no permitida: ${ext || '(ninguna)'}` });
    }

    const buffer = await readBody(req, MAX_UPLOAD);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const stored = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${filename}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, stored), buffer);
    return sendJson(res, 201, { url: `assets/uploads/${stored}`, name: stored, bytes: buffer.length });
  }

  /* Settings */
  match = pathname.match(/^\/api\/settings\/([a-zA-Z]+)$/);
  if (match && (method === 'PUT' || method === 'PATCH')) {
    if (!requireAuth()) return;
    if (!GROUPS.includes(match[1])) return sendJson(res, 400, { error: 'Grupo desconocido' });
    let body = await readJson(req);
    if (match[1] === 'blocks') body = sanitizeBlocks(body);
    return sendJson(res, 200, { group: match[1], value: db.setGroup(match[1], body) });
  }

  /* Projects */
  if (pathname === '/api/projects' && method === 'POST') {
    if (!requireAuth()) return;
    const body = await readJson(req);
    if (!body.slug || !body.title) return sendJson(res, 400, { error: 'slug y title son obligatorios' });
    if (db.getProject(body.slug)) return sendJson(res, 409, { error: 'Ya existe un proyecto con ese slug' });
    return sendJson(res, 201, db.createProject(body));
  }

  if (pathname === '/api/projects/order' && method === 'PUT') {
    if (!requireAuth()) return;
    const body = await readJson(req);
    if (!Array.isArray(body.ids)) return sendJson(res, 400, { error: 'Se espera { ids: [] }' });
    db.reorderProjects(body.ids);
    return sendJson(res, 200, { ok: true });
  }

  match = pathname.match(/^\/api\/projects\/(\d+)$/);
  if (match) {
    if (method === 'PUT' || method === 'PATCH') {
      if (!requireAuth()) return;
      const body = await readJson(req);
      const updated = db.updateProject(match[1], body);
      if (!updated) return sendJson(res, 404, { error: 'Proyecto no encontrado' });
      return sendJson(res, 200, updated);
    }
    if (method === 'DELETE') {
      if (!requireAuth()) return;
      const project = db.getProject(match[1]);
      if (project && project.system) {
        return sendJson(res, 400, { error: 'El proyecto «Inicio» no se puede eliminar' });
      }
      const ok = db.deleteProject(match[1]);
      return sendJson(res, ok ? 200 : 404, { ok });
    }
  }

  match = pathname.match(/^\/api\/projects\/(\d+)\/images$/);
  if (match && method === 'POST') {
    if (!requireAuth()) return;
    const project = db.getProject(match[1]);
    if (!project) return sendJson(res, 404, { error: 'Proyecto no encontrado' });
    const body = await readJson(req);
    if (!body.src) return sendJson(res, 400, { error: 'src es obligatorio' });

    // A new image must bind to a real widget of the page; otherwise it
    // could never be painted or could steal another slot. Pick the first
    // free picture slot automatically.
    if (!body.widgetId && project.page) {
      const file = path.join(BASE_DIR, project.page);
      if (fs.existsSync(file)) {
        const used = new Set(
          db.listImages(project.id, { includeHidden: true })
            .map(image => image.widgetId)
            .filter(Boolean)
        );
        const free = parseImages(fs.readFileSync(file, 'utf8')).find(image => !used.has(image.widgetId));
        if (free) body.widgetId = free.widgetId;
      }
    }

    return sendJson(res, 201, db.createImage(project.id, body));
  }

  /* Images */
  if (pathname === '/api/images/order' && method === 'PUT') {
    if (!requireAuth()) return;
    const body = await readJson(req);
    if (!Array.isArray(body.ids)) return sendJson(res, 400, { error: 'Se espera { ids: [] }' });
    db.reorderImages(body.ids);
    return sendJson(res, 200, { ok: true });
  }

  match = pathname.match(/^\/api\/images\/(\d+)$/);
  if (match) {
    if (method === 'PUT' || method === 'PATCH') {
      if (!requireAuth()) return;
      const body = await readJson(req);
      const updated = db.updateImage(match[1], body);
      if (!updated) return sendJson(res, 404, { error: 'Imagen no encontrada' });
      return sendJson(res, 200, updated);
    }
    if (method === 'DELETE') {
      if (!requireAuth()) return;
      const ok = db.hideImage(match[1]);
      return sendJson(res, ok ? 200 : 404, { ok, hidden: true });
    }
  }

  return sendJson(res, 404, { error: 'Ruta de API no encontrada' });
}

/* Mirror every successful change into content/site.json, which is the
   file committed to git. Cheap: a small JSON write per edit. */
function snapshotContent(req, res, url) {
  if (req.method.toUpperCase() === 'GET') return;
  if (res.statusCode < 200 || res.statusCode >= 300) return;
  if (/^\/api\/(login|logout|session|upload|admin)\b/.test(url.pathname)) return;

  try {
    contentFile.exportContent();
  } catch (error) {
    console.warn('[cms] No se pudo escribir content/site.json:', error.message);
  }
}

/* ── Server ───────────────────────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      snapshotContent(req, res, url);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (error) {
    if (!res.headersSent) {
      sendJson(res, error.status || 500, { error: error.message || 'Error interno' });
    } else {
      res.end();
    }
  }
});

const seedResult = seedIfEmpty();
const homeCreated = ensureHomeProject();
if (homeCreated) console.log('Proyecto «Inicio» creado para las imágenes fijas de la portada');
const prunedImages = pruneOrphanImages();
const reconciled = reconcileProjectImages();
if (prunedImages || reconciled.added || reconciled.reordered) {
  if (prunedImages) console.log(`Imágenes huérfanas eliminadas: ${prunedImages}`);
  if (reconciled.added || reconciled.reordered) {
    console.log(`Imágenes sincronizadas con las páginas: +${reconciled.added} nuevas, ${reconciled.reordered} reordenadas`);
  }
  try {
    contentFile.exportContent();
  } catch (error) {
    console.warn('[cms] No se pudo escribir content/site.json:', error.message);
  }
}
CACHE_VERSION = db.getCacheVersion();
setInterval(auth.pruneSessions, 1000 * 60 * 30).unref();

server.listen(PORT, () => {
  const token = auth.adminToken();
  console.log('===================================================');
  console.log('Terán Studio — Servidor full stack activo');
  console.log(`Sitio:  http://localhost:${PORT}`);
  console.log(`Panel:  http://localhost:${PORT}/admin`);
  console.log(`SQLite: ${db.DB_PATH}`);
  if (seedResult.seeded) {
    console.log(`Contenido sembrado: ${seedResult.projects} páginas, ${seedResult.images} imágenes`);
  }
  if (!token) {
    console.log('ADVERTENCIA: ADMIN_TOKEN no está configurado. Crea un .env');
    console.log('             con ADMIN_TOKEN=tu-token-secreto para entrar al panel.');
  } else {
    console.log(`Token:  ${token.length} caracteres cargados desde .env`);
  }
  console.log('Presiona Ctrl+C para detener el servidor.');
  console.log('===================================================');
});
