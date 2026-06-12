// Hoorshid QR-menu server — Express + SQLite, fully self-contained (no cloud services).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import { ROOT, ENV_FILE, UPLOADS_DIR, CLIENT_DIST } from './paths.js';

// Auto-create .env with a random session secret on first run.
if (!fs.existsSync(ENV_FILE)) {
  fs.writeFileSync(
    ENV_FILE,
    `SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}\n` +
      `# Set the admin password with: npm run set-password -- <password>\n`,
    'utf8'
  );
}
dotenv.config({ path: ENV_FILE });

const menuRoutes = (await import('./routes/menu.js')).default;
const authRoutes = (await import('./routes/auth.js')).default;
const adminRoutes = (await import('./routes/admin.js')).default;
const uploadRoutes = (await import('./routes/upload.js')).default;
const userRoutes = (await import('./routes/users.js')).default;
const { errorHandler } = await import('./lib/validate.js');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IPs behind nginx
app.use(compression());
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

// Uploaded photos — immutable filenames, so cache aggressively.
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

app.use('/api', menuRoutes);
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', uploadRoutes);
app.use('/api', userRoutes);

// In production, serve the built frontend from Express (single process behind nginx).
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { maxAge: '7d', index: false }));
  app.get(/^(?!\/(api|uploads)\b).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Hoorshid server running on http://localhost:${PORT}`);
  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.warn('⚠ Admin password not set — run: npm run set-password -- <password>');
  }
});
