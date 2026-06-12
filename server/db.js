import fs from 'node:fs';
import Database from 'better-sqlite3';
import { DATA_DIR, DB_FILE } from './paths.js';

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slug       TEXT UNIQUE,
    name_fa    TEXT NOT NULL,
    name_en    TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible    INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id    INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name_fa        TEXT NOT NULL,
    name_en        TEXT NOT NULL,
    desc_fa        TEXT NOT NULL DEFAULT '',
    desc_en        TEXT NOT NULL DEFAULT '',
    image          TEXT,
    active         INTEGER NOT NULL DEFAULT 1,
    -- discount_type: 'percent' (discount_value = % off) or 'fixed' (discount_value = final price in Toman)
    discount_type  TEXT CHECK (discount_type IN ('percent', 'fixed')),
    discount_value INTEGER,
    sort_order     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS variants (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id    INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    label_fa   TEXT NOT NULL DEFAULT '',
    label_en   TEXT NOT NULL DEFAULT '',
    price      INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
  CREATE INDEX IF NOT EXISTS idx_variants_item  ON variants(item_id);

  -- Multiple photos per item; sort_order 0 is the main photo shown on the card.
  CREATE TABLE IF NOT EXISTS item_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id    INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    filename   TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_item_images_item ON item_images(item_id);

  -- Restaurant-level settings editable in the admin panel (address, phone, map location).
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  -- Admin panel users. Only 'manager' role can manage users and view the activity log.
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Audit trail of admin actions (username denormalized so history survives user deletion).
  CREATE TABLE IF NOT EXISTS activity_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username   TEXT NOT NULL DEFAULT '',
    action     TEXT NOT NULL,
    detail     TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_log_created ON activity_log(created_at);
`);

// Bootstrap: turn the legacy single-password setup (.env ADMIN_PASSWORD_HASH)
// into the initial 'manager' user the first time the users table is seen empty.
if (
  process.env.ADMIN_PASSWORD_HASH &&
  db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0
) {
  db.prepare("INSERT INTO users (username, password_hash, role) VALUES ('manager', ?, 'manager')")
    .run(process.env.ADMIN_PASSWORD_HASH);
}

// Migration: stock counter per item (NULL = unlimited / not tracked, 0 = out of stock).
const itemCols = db.prepare('PRAGMA table_info(items)').all().map((c) => c.name);
if (!itemCols.includes('stock')) {
  db.exec('ALTER TABLE items ADD COLUMN stock INTEGER');
}

// One-time migration: move the legacy single items.image column into item_images.
const legacy = db.prepare("SELECT id, image FROM items WHERE image IS NOT NULL AND image != ''").all();
if (legacy.length) {
  const ins = db.prepare('INSERT INTO item_images (item_id, filename, sort_order) VALUES (?, ?, 0)');
  db.transaction(() => {
    legacy.forEach((row) => ins.run(row.id, row.image));
    db.exec('UPDATE items SET image = NULL');
  })();
}

// Default settings (placeholders — the manager edits these in the admin panel).
const settingDefaults = {
  address_fa: 'تهران، خیابان ولیعصر، نبش کوچه مهر، پلاک ۱۲',
  address_en: '12 Valiasr St., corner of Mehr Alley, Tehran',
  phone: '0900 240 6050',
  maps_query: '35.7219,51.3347',
  hours_fa: 'همه‌روزه از ساعت ۱۹:۰۰ تا ۰۱:۰۰ بامداد',
  hours_en: 'Open daily 19:00 – 01:00',
};
const insDefault = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
Object.entries(settingDefaults).forEach(([k, v]) => insDefault.run(k, v));

export default db;
