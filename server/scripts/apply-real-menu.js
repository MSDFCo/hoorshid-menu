// One-off: replace the placeholder menu with the restaurant's real item list
// (provided by the owner on 2026-06-11). Keeps the Drinks category untouched and
// re-attaches existing uploaded photos to the matching new items (photoFrom =
// old item's name_fa). Run from the repo: node server/scripts/apply-real-menu.js
import db from '../db.js';

const P1 = ['یک نفره', '1 Person'];
const P2 = ['دو نفره', '2 Persons'];
const P3 = ['سه نفره', '3 Persons'];
const P4 = ['چهار نفره', '4 Persons'];
const S = ['یک نفره', 'Single'];
const D = ['دو نفره', 'Double'];

const baalbakiVariants = (a, b, c, d) => [
  [...P1, a],
  [...P2, b],
  [...P3, c],
  [...P4, d],
];
const pizzaVariants = (single, double) => [
  [...S, single],
  [...D, double],
];
const one = (price) => [['', '', price]];

const MENU = {
  baalbaki: {
    name_fa: 'پیتزا بعلبکی لبنانی',
    name_en: 'Lebanese Baalbaki Pizza',
    items: [
      {
        fa: 'پیتزا بعلبکی لبنانی مخصوص',
        en: 'Special Baalbaki',
        dfa: 'خمیر مخصوص، قارچ بلانچ، ذرت، زیتون سیاه، ژامبون گوشت و مرغ، پنیر پیتزای مطهر، رومال زرده تخم‌مرغ، کنجد سفید',
        den: 'Special dough, blanched mushrooms, corn, black olives, beef & chicken ham, premium pizza cheese, egg-yolk glaze, white sesame',
        variants: baalbakiVariants(625000, 1250000, 1875000, 2500000),
        photoFrom: 'بعلبکی مخصوص هورشید',
      },
      {
        fa: 'پیتزا بعلبکی لبنانی پپرونی',
        en: 'Pepperoni Baalbaki',
        dfa: 'خمیر مخصوص، قارچ بلانچ، ذرت، زیتون سیاه، پپرونی، پنیر پیتزای مرغوب، رومال زرده تخم‌مرغ، کنجد سفید',
        den: 'Special dough, blanched mushrooms, corn, black olives, pepperoni, premium pizza cheese, egg-yolk glaze, white sesame',
        variants: baalbakiVariants(625000, 1250000, 1875000, 2500000),
        photoFrom: 'بعلبکی پپرونی',
      },
      {
        fa: 'پیتزا بعلبکی لبنانی میکس',
        en: 'Mix Baalbaki',
        dfa: 'خمیر مخصوص، گوشت رست بیف، مرغ شاورما، ذرت، زیتون سیاه، قارچ بلانچ، پنیر پیتزای مرغوب، رومال زرده تخم‌مرغ، کنجد سفید',
        den: 'Special dough, roast beef, shawarma chicken, corn, black olives, blanched mushrooms, premium pizza cheese, egg-yolk glaze, white sesame',
        variants: baalbakiVariants(820000, 1640000, 2450000, 3200000),
      },
      {
        fa: 'پیتزا بعلبکی لبنانی گوشت',
        en: 'Beef Baalbaki',
        dfa: 'خمیر مخصوص، قارچ بلانچ، ذرت، زیتون سیاه، گوشت رست بیف، پنیر پیتزای مرغوب، رومال زرده تخم‌مرغ، کنجد سفید',
        den: 'Special dough, blanched mushrooms, corn, black olives, roast beef, premium pizza cheese, egg-yolk glaze, white sesame',
        variants: baalbakiVariants(880000, 1750000, 2600000, 3400000),
        photoFrom: 'بعلبکی گوشت و قارچ',
      },
      {
        fa: 'پیتزا بعلبکی لبنانی مرغ',
        en: 'Chicken Baalbaki',
        dfa: 'خمیر مخصوص، قارچ بلانچ، ذرت، زیتون سیاه، سینه مرغ، پنیر پیتزای مرغوب، رومال زرده تخم‌مرغ، کنجد سفید',
        den: 'Special dough, blanched mushrooms, corn, black olives, chicken breast, premium pizza cheese, egg-yolk glaze, white sesame',
        variants: baalbakiVariants(780000, 1560000, 2340000, 3120000),
        photoFrom: 'بعلبکی مرغ و قارچ',
      },
      {
        fa: 'پیتزا بعلبکی لبنانی بوقلمون',
        en: 'Turkey Baalbaki',
        dfa: 'خمیر مخصوص، قارچ بلانچ، ذرت، زیتون سیاه، گوشت رست‌شده بوقلمون، پنیر پیتزای مرغوب، رومال زرده تخم‌مرغ، کنجد سفید',
        den: 'Special dough, blanched mushrooms, corn, black olives, roasted turkey, premium pizza cheese, egg-yolk glaze, white sesame',
        variants: baalbakiVariants(780000, 1560000, 2340000, 3120000),
      },
      {
        fa: 'پیتزا بعلبکی لبنانی مخصوص ارگانیک',
        en: 'Organic Special Baalbaki',
        dfa: 'خمیر مخصوص، قارچ بلانچ، ذرت، زیتون سیاه، ژامبون مخصوص خانگی، پنیر پیتزای مطهر، رومال زرده تخم‌مرغ، کنجد سفید',
        den: 'Special dough, blanched mushrooms, corn, black olives, homemade organic ham, premium pizza cheese, egg-yolk glaze, white sesame',
        variants: baalbakiVariants(800000, 1600000, 2400000, 3200000),
      },
    ],
  },

  italian: {
    items: [
      { fa: 'رست بیف', en: 'Roast Beef', variants: pizzaVariants(800000, 1600000) },
      { fa: 'مرغ و قارچ', en: 'Chicken & Mushroom', variants: pizzaVariants(699000, 1380000) },
      { fa: 'پپرونی', en: 'Pepperoni', variants: pizzaVariants(660000, 1180000) },
      { fa: 'مخصوص', en: 'Special', variants: pizzaVariants(580000, 1140000) },
      { fa: 'ارگانیک', en: 'Organic', variants: pizzaVariants(698000, 1350000) },
      { fa: 'تورکی برست', en: 'Turkey Breast', variants: pizzaVariants(780000, 1380000) },
    ],
  },

  american: {
    items: [
      { fa: 'رست بیف', en: 'Roast Beef', variants: pizzaVariants(770000, 1500000), photoFrom: 'رست بیف' },
      { fa: 'مرغ و قارچ', en: 'Chicken & Mushroom', variants: pizzaVariants(690000, 1350000) },
      { fa: 'پپرونی', en: 'Pepperoni', variants: pizzaVariants(570000, 1100000), photoFrom: 'پپرونی آمریکایی' },
      { fa: 'مخصوص', en: 'Special', variants: pizzaVariants(590000, 1140000), photoFrom: 'مخصوص آمریکایی' },
      { fa: 'پپرونی و گوشت ویژه', en: 'Pepperoni & Special Beef', variants: pizzaVariants(850000, 1490000) },
      { fa: 'مخصوص ارگانیک', en: 'Organic Special', variants: pizzaVariants(680000, 1350000) },
      { fa: 'تورکی برست', en: 'Turkey Breast', variants: pizzaVariants(680000, 980000) },
      { fa: 'تورکی رونی', en: 'Turkey Roni', variants: pizzaVariants(750000, 1400000) },
    ],
  },

  snacks: {
    items: [
      { fa: 'گوشت', en: 'Beef', variants: one(400000), photoFrom: 'اسنک گوشت و پنیر' },
      { fa: 'مرغ', en: 'Chicken', variants: one(310000), photoFrom: 'اسنک مرغ' },
      { fa: 'پپرونی', en: 'Pepperoni', variants: one(260000) },
      { fa: 'مخصوص', en: 'Special', variants: one(280000) },
      { fa: 'مخصوص ارگانیک', en: 'Organic Special', variants: one(310000) },
    ],
  },

  burgers: {
    items: [
      { fa: 'برگر ذغالی', en: 'Charcoal Burger', variants: one(395000), photoFrom: 'همبرگر کلاسیک' },
      { fa: 'چیزبرگر', en: 'Cheeseburger', variants: one(465000), photoFrom: 'چیزبرگر' },
      { fa: 'ماشروم برگر', en: 'Mushroom Burger', variants: one(515000), photoFrom: 'قارچ برگر' },
      { fa: 'بانی برگر', en: 'Bani Burger', variants: one(490000) },
      { fa: 'میکس برگر', en: 'Mix Burger', variants: one(570000) },
    ],
  },

  sandwiches: {
    items: [
      { fa: 'مرغ', en: 'Chicken', variants: one(420000), photoFrom: 'ساندویچ ژامبون مرغ' },
      { fa: 'رست بیف', en: 'Roast Beef', variants: one(495000) },
      { fa: 'ژامبون میکس سرد', en: 'Cold Mix Ham', variants: one(460000), photoFrom: 'ساندویچ ژامبون گوشت' },
      { fa: 'هات داگ', en: 'Hot Dog', variants: one(290000), photoFrom: 'ساندویچ هات داگ' },
    ],
  },

  'grilled-sandwiches': {
    items: [
      { fa: 'رست بیف', en: 'Roast Beef', variants: one(540000), photoFrom: 'رست بیف گریل' },
      { fa: 'مرغ', en: 'Chicken', variants: one(425000), photoFrom: 'ژامبون تنوری مرغ' },
      { fa: 'پپرونی', en: 'Pepperoni', variants: one(390000) },
      { fa: 'مخصوص', en: 'Special', variants: one(440000) },
    ],
  },

  appetizers: {
    items: [
      { fa: 'سیب‌زمینی سرخ‌شده', en: 'French Fries', variants: one(230000), photoFrom: 'سیب‌زمینی سرخ‌کرده' },
      { fa: 'چیز فرایز', en: 'Cheese Fries', variants: one(280000), photoFrom: 'سیب‌زمینی ویژه با پنیر' },
      { fa: 'هالوپینو فرایز', en: 'Jalapeño Fries', variants: one(340000) },
    ],
  },
};

const insertItem = db.prepare(`
  INSERT INTO items (category_id, name_fa, name_en, desc_fa, desc_en, active, sort_order)
  VALUES (?, ?, ?, ?, ?, 1, ?)
`);
const insertVariant = db.prepare(
  'INSERT INTO variants (item_id, label_fa, label_en, price, sort_order) VALUES (?, ?, ?, ?, ?)'
);
const insertImage = db.prepare(
  'INSERT INTO item_images (item_id, filename, sort_order) VALUES (?, ?, ?)'
);

let kept = 0;
db.transaction(() => {
  for (const [slug, def] of Object.entries(MENU)) {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
    if (!cat) throw new Error(`category not found: ${slug}`);
    if (def.name_fa) {
      db.prepare('UPDATE categories SET name_fa = ?, name_en = ? WHERE id = ?')
        .run(def.name_fa, def.name_en, cat.id);
    }

    // remember the photos of the items we are about to replace
    const oldImages = {};
    for (const o of db.prepare('SELECT * FROM items WHERE category_id = ?').all(cat.id)) {
      oldImages[o.name_fa] = db
        .prepare('SELECT filename FROM item_images WHERE item_id = ? ORDER BY sort_order, id')
        .all(o.id)
        .map((r) => r.filename);
    }

    // replace items (rows cascade; uploaded files stay on disk untouched)
    db.prepare('DELETE FROM items WHERE category_id = ?').run(cat.id);
    def.items.forEach((it, i) => {
      const { lastInsertRowid: id } = insertItem.run(
        cat.id, it.fa, it.en, it.dfa || '', it.den || '', i + 1
      );
      it.variants.forEach((v, vi) => insertVariant.run(id, v[0], v[1], v[2], vi + 1));
      const photos = it.photoFrom ? oldImages[it.photoFrom] : null;
      if (photos?.length) {
        photos.forEach((f, fi) => insertImage.run(id, f, fi));
        kept += photos.length;
      }
    });
  }
})();

const items = db.prepare('SELECT COUNT(*) n FROM items').get().n;
const variants = db.prepare('SELECT COUNT(*) n FROM variants').get().n;
const images = db.prepare('SELECT COUNT(*) n FROM item_images').get().n;
console.log(`Done. ${items} items, ${variants} variants, ${images} photo links (${kept} re-attached).`);
