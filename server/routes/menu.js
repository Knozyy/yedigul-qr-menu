import { Router } from 'express';

export function rowToPublicItem(row) {
  return {
    id: row.id,
    cat: row.category_id,
    thumb: row.name_en.toUpperCase(),
    price: row.is_market_price ? null : row.price,
    kcal: row.kcal ?? null,
    portion: row.portion ?? null,
    image_url: row.image_url,
    diet: JSON.parse(row.diet),
    popular: !!row.popular,
    chef: !!row.chef,
    name: { tr: row.name_tr, en: row.name_en },
    desc: { tr: row.desc_tr, en: row.desc_en },
    ing: { tr: JSON.parse(row.ing_tr), en: JSON.parse(row.ing_en) },
    alg: { tr: JSON.parse(row.alg_tr), en: JSON.parse(row.alg_en) },
  };
}

export function createMenuRouter(db) {
  const router = Router();
  router.get('/', (req, res) => {
    const categories = db
      .prepare('SELECT id, name_tr AS tr, name_en AS en FROM categories WHERE is_active = 1 ORDER BY sort')
      .all();
    const rows = db
      .prepare(
        `SELECT p.* FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.is_available = 1 AND c.is_active = 1
         ORDER BY p.sort`
      )
      .all();
    res.json({ categories, products: rows.map(rowToPublicItem) });
  });
  return router;
}
