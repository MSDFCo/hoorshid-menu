// Seed the SQLite DB from seed/menu.json.
// Usage: npm run seed            (only seeds an empty database)
//        npm run seed -- --force (wipes menu tables and re-seeds)
import fs from 'node:fs';
import db from './db.js';
import { SEED_FILE } from './paths.js';

const force = process.argv.includes('--force');
const existing = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;

if (existing > 0 && !force) {
  console.log(`Database already has ${existing} categories — skipping. Use --force to re-seed.`);
  process.exit(0);
}

const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));

const insertCategory = db.prepare(
  'INSERT INTO categories (slug, name_fa, name_en, sort_order) VALUES (?, ?, ?, ?)'
);
const insertItem = db.prepare(`
  INSERT INTO items (category_id, name_fa, name_en, desc_fa, desc_en, active, discount_type, discount_value, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertVariant = db.prepare(
  'INSERT INTO variants (item_id, label_fa, label_en, price, sort_order) VALUES (?, ?, ?, ?, ?)'
);

db.transaction(() => {
  db.exec('DELETE FROM variants; DELETE FROM items; DELETE FROM categories;');
  seed.categories.forEach((cat, ci) => {
    const { lastInsertRowid: catId } = insertCategory.run(cat.slug, cat.name_fa, cat.name_en, ci + 1);
    (cat.items || []).forEach((item, ii) => {
      const { lastInsertRowid: itemId } = insertItem.run(
        catId,
        item.name_fa,
        item.name_en,
        item.desc_fa || '',
        item.desc_en || '',
        item.active === false ? 0 : 1,
        item.discount?.type ?? null,
        item.discount?.value ?? null,
        ii + 1
      );
      item.variants.forEach((v, vi) =>
        insertVariant.run(itemId, v.label_fa || '', v.label_en || '', v.price, vi + 1)
      );
    });
  });
})();

const counts = {
  categories: db.prepare('SELECT COUNT(*) AS n FROM categories').get().n,
  items: db.prepare('SELECT COUNT(*) AS n FROM items').get().n,
  variants: db.prepare('SELECT COUNT(*) AS n FROM variants').get().n,
};
console.log(`Seeded ${counts.categories} categories, ${counts.items} items, ${counts.variants} price variants.`);
