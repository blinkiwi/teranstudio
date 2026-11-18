'use strict';

/**
 * Single-token authentication.
 *
 * The admin token lives in ADMIN_TOKEN (.env or the real environment).
 * A correct token creates an in-memory session referenced by an
 * HttpOnly cookie, so the browser never keeps the token itself.
 */

const crypto = require('crypto');

const COOKIE_NAME = 'noplan_admin';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const sessions = new Map(); // sessionId -> { createdAt, lastSeen }

function adminToken() {
  return (process.env.ADMIN_TOKEN || '').trim();
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyToken(token) {
  const expected = adminToken();
  if (!expected) return false;
  return safeEqual(token || '', expected);
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function createSession() {
  const id = crypto.randomBytes(32).toString('hex');
  sessions.set(id, { createdAt: Date.now(), lastSeen: Date.now() });
  return id;
}

function destroySession(id) {
  if (id) sessions.delete(id);
}

function sessionIdFromRequest(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return parseCookies(req)[COOKIE_NAME] || '';
}

function isAuthenticated(req) {
  // A direct token header always works (useful for scripts and curl).
  const header = req.headers.authorization || '';
  if (header.startsWith('Token ')) return verifyToken(header.slice(6).trim());

  const id = sessionIdFromRequest(req);
  if (!id) return false;

  const session = sessions.get(id);
  if (!session) return false;

  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(id);
    return false;
  }

  session.lastSeen = Date.now();
  return true;
}

function sessionCookie(id) {
  return `${COOKIE_NAME}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Periodically drop expired sessions so the map cannot grow forever. */
function pruneSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

module.exports = {
  COOKIE_NAME,
  adminToken,
  verifyToken,
  createSession,
  destroySession,
  sessionIdFromRequest,
  isAuthenticated,
  sessionCookie,
  clearCookie,
  pruneSessions
};
