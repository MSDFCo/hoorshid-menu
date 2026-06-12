// Authenticated admin API: full CRUD on items, categories and settings.
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import db from '../db.js';
import { requireAuth } from '../auth.js';
import { serializeItem } from '../lib/discount.js';
import { str, int, variantList, imagesList, ValidationError } from '../lib/validate.js';
import { getSettings, setSetting, SETTING_KEYS } from '../lib/settings.js';
import { logAction } from '../lib/log.js';
import { UPLOADS_DIR } from '../paths.js';

const router = Router();
router.use(requireAuth);

const getItem = db.prepare('SELECT * FROM items WHERE id = ?');
const getVariants = db.prepare('SELECT * FROM variants WHERE item_id = ? ORDER BY sort_order, id');
const getImages = db.prepare('SELECT filename FROM item_images WHERE item_id = ? ORDER BY sort_order, id');
const insertImage = db.prepare('INSERT INTO item_images (item_id, filename, sort_order) VALUES (?, ?, ?)');

const imagesOf = (itemId) => getImages.all(itemId).map((r) => r.filename);

function fullItem(id) {
  const item = getItem.get(id);
  if (!item) throw Object.assign(new Error('item not found'), { status: 404 });
  return serializeItem(item, getVariants.all(id), imagesOf(id));
}

/** Delete uploaded image files that no item references anymore. */
function cleanupImages(filenames) {
  const stillUsed = db.prepare('SELECT COUNT(*) AS n FROM item_images WHERE filename = ?');
  for (const filename of filenames) {
    if (!filename || stillUsed.get(filename).n > 0) continue;
    fs.promises.unlink(path.join(UPLOADS_DIR, path.basename(filename))).catch(() => {});
  }
}

// ---- Full menu (including hidden/inactive) for the admin UI ----
router.get('/admin/menu', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all();
  const items = db.prepare('SELECT * FROM items ORDER BY sort_order, id').all();
  const byCat = items.reduce((m, it) => (((m[it.category_id] ||= []).push(it)), m), {});
  res.json({
    categories: categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name_fa: cat.name_fa,
      name_en: cat.name_en,
      visible: !!cat.visible,
      sort_order: cat.sort_order,
      items: (byCat[cat.id] || []).map((it) => serializeItem(it, getVariants.all(it.id), imagesOf(it.id))),
    })),
    settings: getSettings(),
  });
});

// ---- Settings (address, phone, map location) ----
const SETTING_LABELS = {
  address_fa: 'آدرس (فارسی)',
  address_en: 'آدرس (انگلیسی)',
  phone: 'تلفن',
  maps_query: 'موقعیت نقشه',
  hours_fa: 'ساعت کاری (فارسی)',
  hours_en: 'ساعت کاری (انگلیسی)',
};

router.put('/settings', (req, res) => {
  const before = getSettings();
  const clip = (s) => ((s = String(s ?? '')), s.length > 60 ? s.slice(0, 57) + '…' : s || '—');
  const changes = [];
  for (const key of SETTING_KEYS) {
    if (req.body?.[key] === undefined) continue;
    const value = str(req.body[key], { field: key, max: 300 });
    if (value === (before[key] ?? '')) continue; // only log real changes
    setSetting(key, value);
    changes.push(`${SETTING_LABELS[key] ?? key}: از «${clip(before[key])}» به «${clip(value)}»`);
  }
  if (changes.length) logAction(req, 'settings.update', changes.join(' | '));
  res.json(getSettings());
});

// ---- Items ----

function parseItemBody(body) {
  const categoryId = int(body.category_id, { field: 'category_id', min: 1 });
  if (!db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId)) {
    throw new ValidationError('category does not exist');
  }
  return {
    category_id: categoryId,
    name_fa: str(body.name_fa, { field: 'name_fa', required: true, max: 120 }),
    name_en: str(body.name_en, { field: 'name_en', required: true, max: 120 }),
    desc_fa: str(body.desc_fa, { field: 'desc_fa', max: 500 }),
    desc_en: str(body.desc_en, { field: 'desc_en', max: 500 }),
    images: imagesList(body.images),
    variants: variantList(body.variants),
  };
}

const insertItem = db.prepare(`
  INSERT INTO items (category_id, name_fa, name_en, desc_fa, desc_en, sort_order)
  VALUES (@category_id, @name_fa, @name_en, @desc_fa, @desc_en,
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM items WHERE category_id = @category_id))
`);
const insertVariant = db.prepare(`
  INSERT INTO variants (item_id, label_fa, label_en, price, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

router.post('/items', (req, res) => {
  const data = parseItemBody(req.body);
  const created = db.transaction(() => {
    const { lastInsertRowid: id } = insertItem.run(data);
    data.variants.forEach((v, i) => insertVariant.run(id, v.label_fa, v.label_en, v.price, i));
    data.images.forEach((f, i) => insertImage.run(id, f, i));
    return id;
  })();
  logAction(req, 'item.create', data.name_fa);
  res.status(201).json(fullItem(created));
});

router.put('/items/:id', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  if (!getItem.get(id)) return res.status(404).json({ error: 'item not found' });
  const oldImages = imagesOf(id);
  const oldVariants = getVariants.all(id);
  const data = parseItemBody(req.body);
  db.transaction(() => {
    db.prepare(`
      UPDATE items SET category_id = @category_id, name_fa = @name_fa, name_en = @name_en,
                       desc_fa = @desc_fa, desc_en = @desc_en
      WHERE id = @id
    `).run({
      id,
      category_id: data.category_id,
      name_fa: data.name_fa,
      name_en: data.name_en,
      desc_fa: data.desc_fa,
      desc_en: data.desc_en,
    });
    db.prepare('DELETE FROM variants WHERE item_id = ?').run(id);
    data.variants.forEach((v, i) => insertVariant.run(id, v.label_fa, v.label_en, v.price, i));
    db.prepare('DELETE FROM item_images WHERE item_id = ?').run(id);
    data.images.forEach((f, i) => insertImage.run(id, f, i));
  })();
  cleanupImages(oldImages.filter((f) => !data.images.includes(f)));
  // log price changes explicitly so the manager can audit them
  const priceChanges = data.variants
    .map((v, i) => {
      const old = oldVariants[i];
      if (!old || old.price === v.price) return null;
      return `${v.label_fa || 'قیمت'}: ${old.price.toLocaleString('en-US')} → ${v.price.toLocaleString('en-US')}`;
    })
    .filter(Boolean);
  logAction(req, 'item.update', data.name_fa + (priceChanges.length ? ` | ${priceChanges.join('، ')}` : ''));
  res.json(fullItem(id));
});

router.delete('/items/:id', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  const existing = getItem.get(id);
  if (!existing) return res.status(404).json({ error: 'item not found' });
  const oldImages = imagesOf(id);
  db.prepare('DELETE FROM items WHERE id = ?').run(id); // cascades to variants + item_images
  cleanupImages(oldImages);
  logAction(req, 'item.delete', existing.name_fa);
  res.json({ ok: true });
});

router.patch('/items/:id/toggle', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  const result = db.prepare('UPDATE items SET active = 1 - active WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'item not found' });
  const item = getItem.get(id);
  logAction(req, 'item.toggle', `${item.name_fa} → ${item.active ? 'نمایش' : 'مخفی'}`);
  res.json(fullItem(id));
});

// Stock counter: { stock: <count> } or { stock: null } for unlimited.
router.patch('/items/:id/stock', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  if (!getItem.get(id)) return res.status(404).json({ error: 'item not found' });
  const raw = req.body?.stock;
  const stock =
    raw === null || raw === undefined || raw === ''
      ? null
      : int(raw, { field: 'stock', min: 0, max: 100000 });
  db.prepare('UPDATE items SET stock = ? WHERE id = ?').run(stock, id);
  logAction(req, 'item.stock', `${getItem.get(id).name_fa} → ${stock === 0 ? 'ناموجود' : 'موجود'}`);
  res.json(fullItem(id));
});

router.patch('/items/:id/discount', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  if (!getItem.get(id)) return res.status(404).json({ error: 'item not found' });

  const { type } = req.body ?? {};
  if (type === null || type === undefined || type === '') {
    // one-click discount removal
    db.prepare('UPDATE items SET discount_type = NULL, discount_value = NULL WHERE id = ?').run(id);
    logAction(req, 'item.discount.remove', getItem.get(id).name_fa);
    return res.json(fullItem(id));
  }
  if (type !== 'percent' && type !== 'fixed') {
    throw new ValidationError("discount type must be 'percent', 'fixed' or null");
  }
  const value =
    type === 'percent'
      ? int(req.body.value, { field: 'value', min: 1, max: 99 })
      : int(req.body.value, { field: 'value', min: 1 });
  db.prepare('UPDATE items SET discount_type = ?, discount_value = ? WHERE id = ?').run(type, value, id);
  logAction(
    req,
    'item.discount',
    `${getItem.get(id).name_fa}: ${type === 'percent' ? value + '%' : value.toLocaleString('en-US')}`
  );
  res.json(fullItem(id));
});

// ---- Categories ----

router.post('/categories', (req, res) => {
  const name_fa = str(req.body?.name_fa, { field: 'name_fa', required: true, max: 120 });
  const name_en = str(req.body?.name_en, { field: 'name_en', required: true, max: 120 });
  const { lastInsertRowid: id } = db
    .prepare(`INSERT INTO categories (slug, name_fa, name_en, sort_order)
              VALUES (NULL, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))`)
    .run(name_fa, name_en);
  logAction(req, 'category.create', name_fa);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

router.put('/categories/:id', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!cat) return res.status(404).json({ error: 'category not found' });
  const name_fa = str(req.body?.name_fa ?? cat.name_fa, { field: 'name_fa', required: true, max: 120 });
  const name_en = str(req.body?.name_en ?? cat.name_en, { field: 'name_en', required: true, max: 120 });
  const visible = req.body?.visible === undefined ? cat.visible : req.body.visible ? 1 : 0;
  db.prepare('UPDATE categories SET name_fa = ?, name_en = ?, visible = ? WHERE id = ?')
    .run(name_fa, name_en, visible, id);
  logAction(req, 'category.update', `${name_fa}${visible !== cat.visible ? (visible ? ' → نمایش' : ' → مخفی') : ''}`);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

router.patch('/categories/reorder', (req, res) => {
  const order = req.body?.order;
  if (!Array.isArray(order) || order.some((x) => !Number.isInteger(x))) {
    throw new ValidationError('order must be an array of category ids');
  }
  const update = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
  db.transaction(() => order.forEach((catId, i) => update.run(i + 1, catId)))();
  logAction(req, 'category.reorder');
  res.json({ ok: true });
});

router.delete('/categories/:id', (req, res) => {
  const id = int(req.params.id, { field: 'id', min: 1 });
  const count = db.prepare('SELECT COUNT(*) AS n FROM items WHERE category_id = ?').get(id).n;
  if (count > 0) {
    throw new ValidationError('category is not empty — move or delete its items first');
  }
  const cat = db.prepare('SELECT name_fa FROM categories WHERE id = ?').get(id);
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'category not found' });
  logAction(req, 'category.delete', cat?.name_fa ?? '');
  res.json({ ok: true });
});

export default router;
