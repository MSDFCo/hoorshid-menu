// Photo upload: images only, max 2MB, resized server-side to max 800px and stored as webp.
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { requireAuth } from '../auth.js';
import { logAction } from '../lib/log.js';
import { UPLOADS_DIR } from '../paths.js';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error('only image files are allowed (jpeg, png, webp, gif, avif)'));
  },
});

const router = Router();

router.post('/upload', requireAuth, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'image is larger than 2MB' : err.message;
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'no image file provided' });
    try {
      const filename = `img_${crypto.randomBytes(8).toString('hex')}.webp`;
      // sharp re-encodes the bytes, which also guarantees the stored file really is an image.
      await sharp(req.file.buffer)
        .rotate() // respect EXIF orientation from phone cameras
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(UPLOADS_DIR, filename));
      logAction(req, 'upload', filename);
      res.status(201).json({ filename, url: `/uploads/${filename}` });
    } catch {
      res.status(400).json({ error: 'file could not be processed as an image' });
    }
  });
});

export default router;
