'use strict';

/**
 * Minimal .env loader (no dependencies).
 * Reads KEY=VALUE lines from the project root and fills process.env
 * without overriding variables that are already defined.
 */

const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const target = file || path.join(__dirname, '..', '.env');

  let raw;
  try {
    raw = fs.readFileSync(target, 'utf8');
  } catch (_) {
    return; // No .env file: rely on the real environment.
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    if (!key) continue;

    let value = trimmed.slice(eq + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);

    if (!(key in process.env)) process.env[key] = value;
  }
}

module.exports = { loadEnv };
