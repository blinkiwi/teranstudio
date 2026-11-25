'use strict';

/**
 * Minimal .env loader (no dependencies).
 * Reads KEY=VALUE lines from the project root and fills process.env
 * without overriding variables that are already defined.
 */

const fs = require('fs');
const path = require('path');

function envFile() {
  return path.join(__dirname, '..', '.env');
}

function loadEnv(file) {
  const target = file || envFile();

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

/**
 * Update (or append) a single KEY=VALUE line in the project .env file,
 * keeping comments and every other variable untouched. Also updates the
 * running process so the change applies without a restart.
 */
function setEnvVar(key, value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error(`Clave inválida: ${key}`);
  if (/[\r\n]/.test(String(value))) throw new Error('El valor no puede contener saltos de línea');

  const target = envFile();
  let raw = '';
  try {
    raw = fs.readFileSync(target, 'utf8');
  } catch (_) {
    raw = '';
  }

  const matcher = new RegExp(`^\\s*${key}\\s*=`);
  const lines = raw.split(/\r?\n/);
  let replaced = false;

  const output = lines.map(line => {
    if (!replaced && matcher.test(line)) {
      replaced = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!replaced) {
    while (output.length && output[output.length - 1] === '') output.pop();
    output.push(`${key}=${value}`, '');
  }

  fs.writeFileSync(target, output.join('\n'), { mode: 0o600 });
  process.env[key] = String(value);
  return target;
}

module.exports = { loadEnv, setEnvVar };
