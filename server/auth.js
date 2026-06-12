// Per-user admin sessions: an HMAC-signed "userId.expiry" in an httpOnly cookie.
// No session store needed, and sessions survive server restarts (pm2 etc.).
import crypto from 'node:crypto';
import db from './db.js';

const COOKIE_NAME = 'hoorshid_admin';
const SESSION_HOURS = 12;

function secret() {
  return process.env.SESSION_SECRET || '';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createSessionCookie(res, userId) {
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = `${userId}.${expires}`;
  const token = `${payload}.${sign(payload)}`;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
    maxAge: SESSION_HOURS * 3600 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

/** Verify the cookie and return the logged-in user ({id, username, role}) or null. */
export function getSessionUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || !secret()) return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const [userId, expires] = payload.split('.');
  if (Number(expires) <= Date.now()) return null;
  return (
    db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(Number(userId)) ?? null
  );
}

export function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  next();
}

/** Gate for user management and the activity log. */
export function requireManager(req, res, next) {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({ error: 'manager only' });
  }
  next();
}
