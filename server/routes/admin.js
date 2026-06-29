import { Router } from 'express';
import { randomUUID } from 'node:crypto';

const JSON_FIELDS = ['diet', 'ing_tr', 'ing_en', 'alg_tr', 'alg_en'];
const PRODUCT_FIELDS = [
  'category_id', 'name_tr', 'name_en', 'desc_tr', 'desc_en', 'price',
  'is_market_price', 'image_url', 'is_available', 'popular', 'chef',
  'diet', 'ing_tr', 'ing_en', 'alg_tr', 'alg_en', 'sort',
];

function hydrate(row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of JSON_FIELDS) out[f] = JSON.parse(row[f]);
  return out;
}

function getProduct(db, id) {
  return hydrate(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
}

export function createAdminRouter({ db, uploadsDir, requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  router.get('/menu', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort').all();
    const products = db.prepare('SELECT * FROM products ORDER BY sort').all().map(hydrate);
    res.json({ categories, products });
  });

  router.post('/products', (req, res) => {
    const b = req.body ?? {};
    if (!b.category_id || !b.name_tr || !b.name_en) {
      return res.status(400).json({ error: 'category_id, name_tr, name_en zorunlu' });
    }
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(b.category_id);
    if (!cat) return res.status(400).json({ error: 'Geçersiz kategori' });
    const id = b.id || randomUUID().slice(0, 8);
    db.prepare(
      `INSERT INTO products
        (id, category_id, name_tr, name_en, desc_tr, desc_en, price, is_market_price,
         image_url, is_available, popular, chef, diet, ing_tr, ing_en, alg_tr, alg_en, sort)
       VALUES
        (@id, @category_id, @name_tr, @name_en, @desc_tr, @desc_en, @price, @is_market_price,
         NULL, @is_available, @popular, @chef, @diet, @ing_tr, @ing_en, @alg_tr, @alg_en, @sort)`
    ).run({
      id,
      category_id: b.category_id,
      name_tr: b.name_tr,
      name_en: b.name_en,
      desc_tr: b.desc_tr ?? '',
      desc_en: b.desc_en ?? '',
      price: b.is_market_price ? null : (b.price ?? null),
      is_market_price: b.is_market_price ? 1 : 0,
      is_available: b.is_available === 0 ? 0 : 1,
      popular: b.popular ? 1 : 0,
      chef: b.chef ? 1 : 0,
      diet: JSON.stringify(b.diet ?? []),
      ing_tr: JSON.stringify(b.ing_tr ?? []),
      ing_en: JSON.stringify(b.ing_en ?? []),
      alg_tr: JSON.stringify(b.alg_tr ?? []),
      alg_en: JSON.stringify(b.alg_en ?? []),
      sort: b.sort ?? 0,
    });
    res.status(201).json(getProduct(db, id));
  });

  router.patch('/products/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    const b = req.body ?? {};
    const sets = [];
    const params = { id: req.params.id };
    for (const f of PRODUCT_FIELDS) {
      if (!(f in b)) continue;
      let v = b[f];
      if (JSON_FIELDS.includes(f)) v = JSON.stringify(v ?? []);
      else if (['is_market_price', 'is_available', 'popular', 'chef'].includes(f)) v = v ? 1 : 0;
      sets.push(`${f} = @${f}`);
      params[f] = v;
    }
    if ('is_market_price' in b && b.is_market_price) {
      sets.push('price = NULL');
    }
    if (sets.length) {
      db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = @id`).run(params);
    }
    res.json(getProduct(db, req.params.id));
  });

  router.delete('/products/:id', (req, res) => {
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Ürün bulunamadı' });
    res.status(204).end();
  });

  return router;
}
