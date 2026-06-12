import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { createSessionCookie, clearSessionCookie, getSessionUser } from '../auth.js';
import { logAction } from '../lib/log.js';

const router = Router();

// Basic brute-force protection: max 8 attempts per IP per 15 minutes.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function rateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

router.post('/login', async (req, res) => {
  if (rateLimited(req.ip)) {
    return res.status(429).json({ error: 'too many attempts, try again later' });
  }
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) {
    return res.status(503).json({ error: 'no users configured — run: npm run set-password -- <password>' });
  }
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = username
    ? db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    : null;
  const ok = user && password.length > 0 && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ error: 'wrong password' });
  attempts.delete(req.ip);
  createSessionCookie(res, user.id);
  logAction({ user }, 'login');
  res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/logout', (req, res) => {
  const user = getSessionUser(req);
  if (user) logAction({ user }, 'logout');
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const user = getSessionUser(req);
  res.json({ authenticated: !!user, user: user ?? null });
});

export default router;
