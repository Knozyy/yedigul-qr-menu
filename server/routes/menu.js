import { Router } from 'express';
import { getSetting, bumpStat } from '../db.js';

// AR/RU çevirisi boş bırakılabilir: boşsa EN'e, o da boşsa TR'ye düşer
const fallback = (v, en, tr) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s) return s;
  return (typeof en === 'string' && en.trim()) ? en : tr;
};
const fallbackList = (v, en, tr) => (v?.length ? v : (en?.length ? en : tr));

function i18nText(row, base) {
  const tr = row[`${base}_tr`];
  const en = row[`${base}_en`];
  return { tr, en, ar: fallback(row[`${base}_ar`], en, tr), ru: fallback(row[`${base}_ru`], en, tr) };
}

function i18nList(row, base) {
  const tr = JSON.parse(row[`${base}_tr`]);
  const en = JSON.parse(row[`${base}_en`]);
  const ar = JSON.parse(row[`${base}_ar`] ?? '[]');
  const ru = JSON.parse(row[`${base}_ru`] ?? '[]');
  return { tr, en, ar: fallbackList(ar, en, tr), ru: fallbackList(ru, en, tr) };
}

export function rowToPublicItem(row) {
  const variants = JSON.parse(row.variants ?? '[]');
  return {
    id: row.id,
    cat: row.category_id,
    thumb: row.name_en.toUpperCase(),
    price: row.is_market_price ? null : row.price,
    kcal: row.kcal ?? null,
    portion: row.portion ?? null,
    image_url: row.image_url,
    images: JSON.parse(row.images ?? '[]'),
    variants: variants.map((v) => ({
      name: {
        tr: v.name_tr, en: v.name_en,
        ar: fallback(v.name_ar, v.name_en, v.name_tr),
        ru: fallback(v.name_ru, v.name_en, v.name_tr),
      },
      price: v.price,
    })),
    diet: JSON.parse(row.diet),
    popular: !!row.popular,
    chef: !!row.chef,
    name: i18nText(row, 'name'),
    desc: i18nText(row, 'desc'),
    ing: i18nList(row, 'ing'),
    alg: i18nList(row, 'alg'),
  };
}

// Menü sayfasının duyuru + restoran bilgisi bloğu (settings'ten)
export function publicMeta(db) {
  return {
    announcement: (() => {
      const tr = getSetting(db, 'announcement_tr', '') || '';
      const en = getSetting(db, 'announcement_en', '') || '';
      return {
        tr, en,
        ar: fallback(getSetting(db, 'announcement_ar', '') || '', en, tr),
        ru: fallback(getSetting(db, 'announcement_ru', '') || '', en, tr),
      };
    })(),
    info: {
      phone: getSetting(db, 'info_phone', '') || '',
      hours: getSetting(db, 'info_hours', '') || '',
      wifi: getSetting(db, 'info_wifi', '') || '',
      instagram: getSetting(db, 'info_instagram', '') || '',
    },
    price_updated_at: getSetting(db, 'price_updated_at', '') || '',
  };
}

export function createMenuRouter(db) {
  const router = Router();
  router.get('/', (req, res) => {
    bumpStat(db, 'menu_view');
    const categories = db
      .prepare('SELECT id, name_tr, name_en, name_ar, name_ru FROM categories WHERE is_active = 1 ORDER BY sort')
      .all()
      .map((c) => ({
        id: c.id,
        tr: c.name_tr,
        en: c.name_en,
        ar: fallback(c.name_ar, c.name_en, c.name_tr),
        ru: fallback(c.name_ru, c.name_en, c.name_tr),
      }));
    const rows = db
      .prepare(
        `SELECT p.* FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.is_available = 1 AND p.is_hidden = 0 AND c.is_active = 1
         ORDER BY p.sort`
      )
      .all();
    res.json({ categories, products: rows.map(rowToPublicItem), meta: publicMeta(db) });
  });
  return router;
}
