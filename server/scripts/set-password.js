// Set or change an admin user's password (creates the user if missing).
// Usage: npm run set-password -- <password>                (user: manager)
//        npm run set-password -- <username> <password>
import fs from 'node:fs';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ENV_FILE } from '../paths.js';

// make sure SESSION_SECRET exists before the DB bootstrap reads .env
let lines = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/) : [];
if (!lines.some((l) => l.startsWith('SESSION_SECRET='))) {
  lines.push(`SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`);
  fs.writeFileSync(ENV_FILE, lines.filter(Boolean).join('\n') + '\n', 'utf8');
}
dotenv.config({ path: ENV_FILE });

const args = process.argv.slice(2);
const username = (args.length >= 2 ? args[0] : 'manager').toLowerCase();
const password = args.length >= 2 ? args[1] : args[0];

if (!password || password.length < 6) {
  console.error('Usage: npm run set-password -- [username] <password>   (minimum 6 characters)');
  process.exit(1);
}

const { default: db } = await import('../db.js');
const hash = bcrypt.hashSync(password, 12);
const existing = db.prepare('SELECT id, role FROM users WHERE username = ?').get(username);

if (existing) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
  console.log(`✔ Password updated for '${username}' (${existing.role}).`);
} else {
  const role = username === 'manager' ? 'manager' : 'staff';
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
  console.log(`✔ User '${username}' created (${role}).`);
}
console.log('Restart the server if it is running.');
