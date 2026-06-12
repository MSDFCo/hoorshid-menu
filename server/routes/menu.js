// Public menu endpoint — only visible categories and active items.
import { Router } from 'express';
import db from '../db.js';
import { serializeItem } from '../lib/discount.js';
import { getSettings } from '../lib/settings.js';

const router = Router();

router.get('/menu', (req, res) => {
  const categories = db
    .prepare('SELECT * FROM categories WHERE visible = 1 ORDER BY sort_order, id')
    .all();
  const itemsByCat = db
    .prepare('SELECT * FROM items WHERE active = 1 ORDER BY sort_order, id')
    .all()
    .reduce((map, item) => {
      (map[item.category_id] ||= []).push(item);
      return map;
    }, {});
  const variantStmt = db.prepare('SELECT * FROM variants WHERE item_id = ? ORDER BY sort_order, id');
  const imageStmt = db.prepare('SELECT filename FROM item_images WHERE item_id = ? ORDER BY sort_order, id');

  const payload = categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name_fa: cat.name_fa,
    name_en: cat.name_en,
    items: (itemsByCat[cat.id] || []).map((item) =>
      serializeItem(item, variantStmt.all(item.id), imageStmt.all(item.id).map((r) => r.filename))
    ),
  }));

  res.json({ categories: payload, settings: getSettings() });
});

export default router;
