import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { resolve, sep } from 'node:path';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';

// Yüklenen dosyanın gerçekten resim olduğunu magic-byte ile doğrula —
// multer'ın fileFilter'ı yalnız istemci Content-Type'ına bakar, o sahtelenebilir.
function sniffImage(path) {
  let b;
  try { b = readFileSync(path); } catch { return false; }
  if (b.length < 12) return false;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;               // JPEG
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true; // PNG
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return true; // WEBP
  return false;
}

const JSON_FIELDS = ['diet', 'ing_tr', 'ing_en', 'alg_tr', 'alg_en'];
// image_url intentionally excluded: only the dedicated image routes may set it
const PRODUCT_FIELDS = [
  'category_id', 'name_tr', 'name_en', 'desc_tr', 'desc_en', 'price',
  'is_market_price', 'is_available', 'popular', 'chef',
  'diet', 'ing_tr', 'ing_en', 'alg_tr', 'alg_en', 'sort', 'kcal',
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

  const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) =>
        cb(null, `${req.params.id}-${Date.now()}${ALLOWED[file.mimetype]}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, !!ALLOWED[file.mimetype]),
  });

  function removeImageFile(url) {
    if (!url) return;
    const root = resolve(uploadsDir);
    const target = resolve(uploadsDir, url.replace('/uploads/', ''));
    // refuse to touch anything outside uploadsDir (path-traversal guard)
    if (target !== root && !target.startsWith(root + sep)) return;
    if (existsSync(target)) {
      try { unlinkSync(target); } catch { /* dosya yoksa/erişilemezse yok say */ }
    }
  }

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
    try {
      db.prepare(
        `INSERT INTO products
          (id, category_id, name_tr, name_en, desc_tr, desc_en, price, is_market_price,
           image_url, is_available, popular, chef, diet, ing_tr, ing_en, alg_tr, alg_en, sort, kcal)
         VALUES
          (@id, @category_id, @name_tr, @name_en, @desc_tr, @desc_en, @price, @is_market_price,
           NULL, @is_available, @popular, @chef, @diet, @ing_tr, @ing_en, @alg_tr, @alg_en, @sort, @kcal)`
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
        kcal: b.kcal ?? null,
      });
    } catch {
      return res.status(400).json({ error: 'Geçersiz veri (örn. kategori bulunamadı)' });
    }
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
    // Piyasa Fiyatı invariant: market price => price NULL (explicit, not order-dependent)
    if ('is_market_price' in b && b.is_market_price) {
      params.price = null;
      if (!sets.includes('price = @price')) sets.push('price = @price');
    }
    if (sets.length) {
      try {
        db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = @id`).run(params);
      } catch {
        return res.status(400).json({ error: 'Geçersiz veri (örn. kategori bulunamadı)' });
      }
    }
    res.json(getProduct(db, req.params.id));
  });

  router.delete('/products/:id', (req, res) => {
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Ürün bulunamadı' });
    res.status(204).end();
  });

  router.post('/categories', (req, res) => {
    const b = req.body ?? {};
    if (!b.id || !b.name_tr || !b.name_en) {
      return res.status(400).json({ error: 'id, name_tr, name_en zorunlu' });
    }
    const exists = db.prepare('SELECT id FROM categories WHERE id = ?').get(b.id);
    if (exists) return res.status(409).json({ error: 'Bu id zaten var' });
    db.prepare(
      `INSERT INTO categories (id, name_tr, name_en, sort, is_active)
       VALUES (@id, @name_tr, @name_en, @sort, @is_active)`
    ).run({
      id: b.id, name_tr: b.name_tr, name_en: b.name_en,
      sort: b.sort ?? 0, is_active: b.is_active === 0 ? 0 : 1,
    });
    res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(b.id));
  });

  router.patch('/categories/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kategori bulunamadı' });
    const b = req.body ?? {};
    const sets = [];
    const params = { id: req.params.id };
    for (const f of ['name_tr', 'name_en', 'sort', 'is_active']) {
      if (!(f in b)) continue;
      sets.push(`${f} = @${f}`);
      params[f] = f === 'is_active' ? (b[f] ? 1 : 0) : b[f];
    }
    if (sets.length) {
      db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = @id`).run(params);
    }
    res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
  });

  router.delete('/categories/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kategori bulunamadı' });
    const count = db.prepare('SELECT COUNT(*) n FROM products WHERE category_id = ?').get(req.params.id).n;
    if (count > 0) return res.status(409).json({ error: 'Kategoride ürün var, önce ürünleri taşı/sil' });
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.status(204).end();
  });

  router.post('/products/:id/image', (req, res) => {
    const existing = db.prepare('SELECT image_url FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    upload.single('image')(req, res, (err) => {
      if (err) return res.status(400).json({ error: 'Yükleme hatası: ' + err.message });
      if (!req.file) return res.status(400).json({ error: 'Geçersiz dosya (jpg/png/webp, ≤5MB)' });
      // içerik gerçekten resim mi? (uzantı/başlık sahteciliğine karşı)
      if (!sniffImage(req.file.path)) {
        try { unlinkSync(req.file.path); } catch { /* yok say */ }
        return res.status(400).json({ error: 'Geçersiz görsel içeriği (jpg/png/webp)' });
      }
      removeImageFile(existing.image_url);
      const url = `/uploads/${req.file.filename}`;
      db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(url, req.params.id);
      res.json(getProduct(db, req.params.id));
    });
  });

  router.delete('/products/:id/image', (req, res) => {
    const existing = db.prepare('SELECT image_url FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    removeImageFile(existing.image_url);
    db.prepare('UPDATE products SET image_url = NULL WHERE id = ?').run(req.params.id);
    res.json(getProduct(db, req.params.id));
  });

  return router;
}
