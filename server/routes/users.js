// Manager-only: user accounts and the activity log.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, requireManager } from '../auth.js';
import { logAction } from '../lib/log.js';
import { str, int, ValidationError } from '../lib/validate.js';

const router = Router();
router.use(requireAuth, requireManager);

const publicUser = 'id, username, role, created_at';

router.get('/users', (req, res) => {
  res.json({ users: db.prepare(`SELECT ${publicUser} FROM users ORDER BY id`).all() });
});

router.post('/users', (req, res) => {
  const username = str(req.body?.username, { field: 'username', required: true, max: 30 }).toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    throw new ValidationError('username must be 3-30 characters: letters, digits, . _ -');
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password.length < 6) throw new ValidationError('password must be at least 6 characters');
  const role = req.body?.role === 'manager' ? 'manager' : 'staff';
  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
    throw new ValidationError('username already exists');
  }
  const { lastInsertRowid: id } = db
    .prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run(username, bcrypt.hashSync(password, 12), role);
  logAction(req, 'user.create', `${username} (${role})`);
  res.status(201).json(db.prepare(`SELECT ${publicUser} FROM users WHERE id = ?`).get(id));
});

router.patch('/users/:id/password', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password.length < 6) throw new ValidationError('password must be at least 6 characters');
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 12), id);
  logAction(req, 'user.password', user.username);
  res.json({ ok: true });
});

router.delete('/users/:id', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  if (user.id === req.user.id) throw new ValidationError('you cannot delete your own account');
  const managers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'manager'").get().n;
  if (user.role === 'manager' && managers <= 1) {
    throw new ValidationError('cannot delete the last manager');
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  logAction(req, 'user.delete', user.username);
  res.json({ ok: true });
});

// Recent activity, newest first. Optional ?user=<username> filter.
router.get('/logs', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
  const user = typeof req.query.user === 'string' ? req.query.user.trim() : '';
  const rows = user
    ? db.prepare('SELECT * FROM activity_log WHERE username = ? ORDER BY id DESC LIMIT ?').all(user, limit)
    : db.prepare('SELECT * FROM activity_log ORDER BY id DESC LIMIT ?').all(limit);
  res.json({ logs: rows });
});

export default router;
