import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { resolve, sep } from 'node:path';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { getSetting, setSetting, logChange, localDay } from '../db.js';
import { isKnownMetric, isValidEntity } from '../snapshot-metrics.js';

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

const JSON_FIELDS = [
  'diet', 'ing_tr', 'ing_en', 'ing_ar', 'ing_ru',
  'alg_tr', 'alg_en', 'alg_ar', 'alg_ru', 'variants', 'images',
];
// image_url/images intentionally excluded: only the dedicated image routes may set them
const PRODUCT_FIELDS = [
  'category_id', 'name_tr', 'name_en', 'name_ar', 'name_ru',
  'desc_tr', 'desc_en', 'desc_ar', 'desc_ru', 'price',
  'is_market_price', 'is_available', 'popular', 'chef', 'is_hidden',
  'diet', 'ing_tr', 'ing_en', 'ing_ar', 'ing_ru',
  'alg_tr', 'alg_en', 'alg_ar', 'alg_ru', 'sort', 'kcal', 'portion', 'variants',
];

const MAX_IMAGES = 6;
const MAX_VARIANTS = 8;

// Varyant doğrulama: [{name_tr, name_en, price}] — geçersizse null döner.
function normalizeVariants(v) {
  if (v == null) return [];
  if (!Array.isArray(v) || v.length > MAX_VARIANTS) return null;
  const out = [];
  for (const it of v) {
    if (!it || typeof it !== 'object') return null;
    const name_tr = String(it.name_tr ?? '').trim();
    const name_en = String(it.name_en ?? '').trim();
    const price = Number(it.price);
    if (!name_tr || !name_en || !Number.isFinite(price) || price < 0) return null;
    out.push({
      name_tr, name_en, price,
      // isteğe bağlı çeviriler; boşsa menü EN'e düşer
      name_ar: String(it.name_ar ?? '').trim(),
      name_ru: String(it.name_ru ?? '').trim(),
    });
  }
  return out;
}

function hydrate(row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of JSON_FIELDS) out[f] = JSON.parse(row[f] ?? '[]');
  return out;
}

function getProduct(db, id) {
  return hydrate(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
}

// Geçmiş kayıtları için alan etiketi + insan-okur değişim özeti
const FIELD_LABELS = {
  category_id: 'kategori', name_tr: 'ad (TR)', name_en: 'ad (EN)',
  name_ar: 'ad (AR)', name_ru: 'ad (RU)',
  desc_tr: 'açıklama (TR)', desc_en: 'açıklama (EN)',
  desc_ar: 'açıklama (AR)', desc_ru: 'açıklama (RU)', price: 'fiyat',
  is_market_price: 'piyasa fiyatı', is_available: 'stok', popular: 'popüler',
  chef: 'şef önerisi', is_hidden: 'gizli', sort: 'sıra', kcal: 'kalori', portion: 'porsiyon',
  diet: 'diyet', ing_tr: 'içindekiler (TR)', ing_en: 'içindekiler (EN)',
  ing_ar: 'içindekiler (AR)', ing_ru: 'içindekiler (RU)',
  alg_tr: 'alerjenler (TR)', alg_en: 'alerjenler (EN)',
  alg_ar: 'alerjenler (AR)', alg_ru: 'alerjenler (RU)', variants: 'varyantlar',
};

function diffSummary(before, after, fields) {
  const parts = [];
  for (const f of fields) {
    const a = before[f];
    const b = after[f];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    const label = FIELD_LABELS[f] || f;
    if (f === 'is_available') parts.push(b ? 'stokta' : 'tükendi');
    else if (['is_market_price', 'popular', 'chef'].includes(f)) parts.push(`${label}: ${b ? 'açık' : 'kapalı'}`);
    else if (Array.isArray(a) || Array.isArray(b)) parts.push(`${label} güncellendi`);
    else parts.push(`${label}: ${a ?? '—'} → ${b ?? '—'}`);
  }
  return parts.join(', ');
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
    if (!url || !uploadsDir) return;
    const root = resolve(uploadsDir);
    const target = resolve(uploadsDir, url.replace('/uploads/', ''));
    // refuse to touch anything outside uploadsDir (path-traversal guard)
    if (target !== root && !target.startsWith(root + sep)) return;
    if (existsSync(target)) {
      try { unlinkSync(target); } catch { /* dosya yoksa/erişilemezse yok say */ }
    }
  }

  function log(action, entity, entityId, detail = '') {
    logChange(db, { action, entity, entityId, detail });
  }

  // Menüde gösterilen "fiyat güncellenme tarihi" — fiyatı etkileyen her
  // değişiklikte damgalanır (balık fiyatı oynak; tarih müşteriye güven verir).
  function touchPriceStamp() {
    setSetting(db, 'price_updated_at', new Date().toISOString());
  }

  // Görsel listesi güncellemesini tek yerden yap: images + kapak (image_url) senkron
  function saveImages(id, images) {
    db.prepare('UPDATE products SET images = ?, image_url = ? WHERE id = ?')
      .run(JSON.stringify(images), images[0] ?? null, id);
  }

  router.get('/menu', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort').all();
    const products = db.prepare('SELECT * FROM products ORDER BY sort').all().map(hydrate);
    res.json({ categories, products });
  });

  // ---- Ayarlar: QR / adres + duyuru + restoran bilgileri ----
  const TEXT_SETTINGS = [
    'announcement_tr', 'announcement_en', 'announcement_ar', 'announcement_ru',
    'info_phone', 'info_hours', 'info_wifi', 'info_instagram',
  ];

  function settingsPayload() {
    const out = {
      public_base_url: getSetting(db, 'public_base_url', ''),
      menu_path: getSetting(db, 'menu_path', '/menu/'),
    };
    for (const k of TEXT_SETTINGS) out[k] = getSetting(db, k, '') || '';
    return out;
  }

  router.get('/settings', (req, res) => {
    res.json(settingsPayload());
  });

  router.put('/settings', (req, res) => {
    const b = req.body ?? {};
    const changed = [];
    if ('menu_path' in b) {
      const p = String(b.menu_path || '').trim();
      // '/' ile başlamalı ama '//host' / '/\host' (protokol-göreli dış yönlendirme) olmamalı
      if (!p.startsWith('/') || p.startsWith('//') || p.startsWith('/\\')) {
        return res.status(400).json({ error: "menu_path site-içi bir yol olmalı ('/' ile başlamalı, '//' değil)" });
      }
      setSetting(db, 'menu_path', p);
      changed.push('menü yolu');
    }
    if ('public_base_url' in b) {
      // sondaki '/' temizle; boş bırakılabilir (o zaman istek origin'i kullanılır)
      setSetting(db, 'public_base_url', String(b.public_base_url || '').trim().replace(/\/+$/, ''));
      changed.push('site adresi');
    }
    for (const k of TEXT_SETTINGS) {
      if (!(k in b)) continue;
      setSetting(db, k, String(b[k] ?? '').trim());
      changed.push(
        k.startsWith('announcement') ? 'duyuru' : k.replace('info_', 'bilgi: ')
      );
    }
    if (changed.length) log('update', 'settings', null, [...new Set(changed)].join(', '));
    res.json(settingsPayload());
  });

  // ---- Ürünler ----
  router.post('/products', (req, res) => {
    const b = req.body ?? {};
    if (!b.category_id || !b.name_tr || !b.name_en) {
      return res.status(400).json({ error: 'category_id, name_tr, name_en zorunlu' });
    }
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(b.category_id);
    if (!cat) return res.status(400).json({ error: 'Geçersiz kategori' });
    const variants = normalizeVariants(b.variants);
    if (variants === null) {
      return res.status(400).json({ error: 'Geçersiz varyantlar (name_tr, name_en, price ≥ 0 zorunlu, en çok 8)' });
    }
    const id = b.id || randomUUID().slice(0, 8);
    // id yüklenen dosya adında kullanılıyor; path/kontrol karakterlerini engelle
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      return res.status(400).json({ error: 'Geçersiz id (yalnızca harf, rakam, tire, alt çizgi)' });
    }
    try {
      db.prepare(
        `INSERT INTO products
          (id, category_id, name_tr, name_en, name_ar, name_ru,
           desc_tr, desc_en, desc_ar, desc_ru, price, is_market_price,
           image_url, images, is_available, popular, chef, is_hidden, diet,
           ing_tr, ing_en, ing_ar, ing_ru, alg_tr, alg_en, alg_ar, alg_ru,
           sort, kcal, portion, variants)
         VALUES
          (@id, @category_id, @name_tr, @name_en, @name_ar, @name_ru,
           @desc_tr, @desc_en, @desc_ar, @desc_ru, @price, @is_market_price,
           NULL, '[]', @is_available, @popular, @chef, @is_hidden, @diet,
           @ing_tr, @ing_en, @ing_ar, @ing_ru, @alg_tr, @alg_en, @alg_ar, @alg_ru,
           @sort, @kcal, @portion, @variants)`
      ).run({
        id,
        category_id: b.category_id,
        name_tr: b.name_tr,
        name_en: b.name_en,
        name_ar: b.name_ar ?? '',
        name_ru: b.name_ru ?? '',
        desc_tr: b.desc_tr ?? '',
        desc_en: b.desc_en ?? '',
        desc_ar: b.desc_ar ?? '',
        desc_ru: b.desc_ru ?? '',
        price: b.is_market_price ? null : (b.price ?? null),
        is_market_price: b.is_market_price ? 1 : 0,
        is_available: b.is_available === 0 ? 0 : 1,
        popular: b.popular ? 1 : 0,
        chef: b.chef ? 1 : 0,
        is_hidden: b.is_hidden ? 1 : 0,
        diet: JSON.stringify(b.diet ?? []),
        ing_tr: JSON.stringify(b.ing_tr ?? []),
        ing_en: JSON.stringify(b.ing_en ?? []),
        ing_ar: JSON.stringify(b.ing_ar ?? []),
        ing_ru: JSON.stringify(b.ing_ru ?? []),
        alg_tr: JSON.stringify(b.alg_tr ?? []),
        alg_en: JSON.stringify(b.alg_en ?? []),
        alg_ar: JSON.stringify(b.alg_ar ?? []),
        alg_ru: JSON.stringify(b.alg_ru ?? []),
        sort: b.sort ?? 0,
        kcal: b.kcal ?? null,
        portion: b.portion ?? null,
        variants: JSON.stringify(variants),
      });
    } catch {
      return res.status(400).json({ error: 'Geçersiz veri (örn. kategori bulunamadı)' });
    }
    log('create', 'product', id, String(b.name_tr));
    touchPriceStamp();
    res.status(201).json(getProduct(db, id));
  });

  router.patch('/products/:id', (req, res) => {
    const before = getProduct(db, req.params.id);
    if (!before) return res.status(404).json({ error: 'Ürün bulunamadı' });
    const b = req.body ?? {};
    if ('variants' in b) {
      const v = normalizeVariants(b.variants);
      if (v === null) {
        return res.status(400).json({ error: 'Geçersiz varyantlar (name_tr, name_en, price ≥ 0 zorunlu, en çok 8)' });
      }
      b.variants = v;
    }
    const sets = [];
    const params = { id: req.params.id };
    for (const f of PRODUCT_FIELDS) {
      if (!(f in b)) continue;
      let v = b[f];
      if (JSON_FIELDS.includes(f)) v = JSON.stringify(v ?? []);
      else if (['is_market_price', 'is_available', 'popular', 'chef', 'is_hidden'].includes(f)) v = v ? 1 : 0;
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
    const after = getProduct(db, req.params.id);
    const summary = diffSummary(before, after, PRODUCT_FIELDS);
    if (summary) log('update', 'product', req.params.id, `${after.name_tr}: ${summary}`);
    if (
      before.price !== after.price ||
      before.is_market_price !== after.is_market_price ||
      JSON.stringify(before.variants) !== JSON.stringify(after.variants)
    ) {
      touchPriceStamp();
    }
    res.json(after);
  });

  router.delete('/products/:id', (req, res) => {
    const existing = getProduct(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    for (const url of existing.images) removeImageFile(url);
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    log('delete', 'product', req.params.id, existing.name_tr);
    res.status(204).end();
  });

  // ---- Kategoriler ----
  router.post('/categories', (req, res) => {
    const b = req.body ?? {};
    if (!b.id || !b.name_tr || !b.name_en) {
      return res.status(400).json({ error: 'id, name_tr, name_en zorunlu' });
    }
    const exists = db.prepare('SELECT id FROM categories WHERE id = ?').get(b.id);
    if (exists) return res.status(409).json({ error: 'Bu id zaten var' });
    db.prepare(
      `INSERT INTO categories (id, name_tr, name_en, name_ar, name_ru, sort, is_active)
       VALUES (@id, @name_tr, @name_en, @name_ar, @name_ru, @sort, @is_active)`
    ).run({
      id: b.id, name_tr: b.name_tr, name_en: b.name_en,
      name_ar: String(b.name_ar ?? ''), name_ru: String(b.name_ru ?? ''),
      sort: b.sort ?? 0, is_active: b.is_active === 0 ? 0 : 1,
    });
    log('create', 'category', b.id, String(b.name_tr));
    res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(b.id));
  });

  router.patch('/categories/:id', (req, res) => {
    const before = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!before) return res.status(404).json({ error: 'Kategori bulunamadı' });
    const b = req.body ?? {};
    const sets = [];
    const params = { id: req.params.id };
    for (const f of ['name_tr', 'name_en', 'name_ar', 'name_ru', 'sort', 'is_active']) {
      if (!(f in b)) continue;
      sets.push(`${f} = @${f}`);
      params[f] = f === 'is_active' ? (b[f] ? 1 : 0) : b[f];
    }
    if (sets.length) {
      db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = @id`).run(params);
    }
    const after = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    const summary = diffSummary(before, after, ['name_tr', 'name_en', 'name_ar', 'name_ru', 'sort', 'is_active']);
    if (summary) log('update', 'category', req.params.id, `${after.name_tr}: ${summary}`);
    res.json(after);
  });

  router.delete('/categories/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kategori bulunamadı' });
    const count = db.prepare('SELECT COUNT(*) n FROM products WHERE category_id = ?').get(req.params.id).n;
    if (count > 0) return res.status(409).json({ error: 'Kategoride ürün var, önce ürünleri taşı/sil' });
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    log('delete', 'category', req.params.id, existing.name_tr);
    res.status(204).end();
  });

  // ---- Görseller ----
  // Kapak değiştir (eski tek-görsel davranışıyla uyumlu): images[0] yenisiyle değişir.
  router.post('/products/:id/image', (req, res) => {
    const existing = getProduct(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    upload.single('image')(req, res, (err) => {
      if (err) return res.status(400).json({ error: 'Yükleme hatası: ' + err.message });
      if (!req.file) return res.status(400).json({ error: 'Geçersiz dosya (jpg/png/webp, ≤5MB)' });
      // içerik gerçekten resim mi? (uzantı/başlık sahteciliğine karşı)
      if (!sniffImage(req.file.path)) {
        try { unlinkSync(req.file.path); } catch { /* yok say */ }
        return res.status(400).json({ error: 'Geçersiz görsel içeriği (jpg/png/webp)' });
      }
      const images = [...existing.images];
      if (images[0]) removeImageFile(images[0]);
      images[0] = `/uploads/${req.file.filename}`;
      saveImages(req.params.id, images);
      log('image', 'product', req.params.id, `${existing.name_tr}: kapak görseli değişti`);
      res.json(getProduct(db, req.params.id));
    });
  });

  // Yeni görsel ekle (listeye eklenir; ilk görsel kapak olur)
  router.post('/products/:id/images', (req, res) => {
    const existing = getProduct(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    if (existing.images.length >= MAX_IMAGES) {
      return res.status(400).json({ error: `En çok ${MAX_IMAGES} görsel eklenebilir` });
    }
    upload.single('image')(req, res, (err) => {
      if (err) return res.status(400).json({ error: 'Yükleme hatası: ' + err.message });
      if (!req.file) return res.status(400).json({ error: 'Geçersiz dosya (jpg/png/webp, ≤5MB)' });
      if (!sniffImage(req.file.path)) {
        try { unlinkSync(req.file.path); } catch { /* yok say */ }
        return res.status(400).json({ error: 'Geçersiz görsel içeriği (jpg/png/webp)' });
      }
      const images = [...existing.images, `/uploads/${req.file.filename}`];
      saveImages(req.params.id, images);
      log('image', 'product', req.params.id, `${existing.name_tr}: görsel eklendi (${images.length}.)`);
      res.json(getProduct(db, req.params.id));
    });
  });

  // Görselleri yeniden sırala / bazılarını çıkar: gövde {images:[...]} mevcut
  // listenin alt kümesi olmalı; listeden çıkanların dosyaları silinir.
  router.put('/products/:id/images', (req, res) => {
    const existing = getProduct(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    const next = req.body?.images;
    if (!Array.isArray(next) || next.some((u) => typeof u !== 'string')) {
      return res.status(400).json({ error: 'images bir URL dizisi olmalı' });
    }
    const current = new Set(existing.images);
    if (new Set(next).size !== next.length || next.some((u) => !current.has(u))) {
      return res.status(400).json({ error: 'images yalnızca mevcut görselleri içerebilir (tekrarsız)' });
    }
    for (const url of existing.images) {
      if (!next.includes(url)) removeImageFile(url);
    }
    saveImages(req.params.id, next);
    log('image', 'product', req.params.id, `${existing.name_tr}: görseller düzenlendi (${next.length} görsel)`);
    res.json(getProduct(db, req.params.id));
  });

  // Kapak görselini kaldır (kalan ilk görsel kapak olur) — eski davranışla uyumlu
  router.delete('/products/:id/image', (req, res) => {
    const existing = getProduct(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });
    const images = [...existing.images];
    const removed = images.shift();
    if (removed) removeImageFile(removed);
    saveImages(req.params.id, images);
    if (removed) log('image', 'product', req.params.id, `${existing.name_tr}: kapak görseli kaldırıldı`);
    res.json(getProduct(db, req.params.id));
  });

  // ---- Değişiklik geçmişi ----
  router.get('/history', (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const entries = db
      .prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?')
      .all(limit);
    res.json({ entries });
  });

  // ---- İstatistik: günlük menü görüntülenme + QR tarama ----
  router.get('/stats', (req, res) => {
    const rows = db
      .prepare("SELECT day, key, n FROM stats_daily WHERE day >= date('now', 'localtime', '-29 days') ORDER BY day")
      .all();
    const byDay = new Map();
    for (const r of rows) {
      if (!byDay.has(r.day)) byDay.set(r.day, { day: r.day, menu_view: 0, qr_scan: 0 });
      byDay.get(r.day)[r.key] = r.n;
    }
    const days = [...byDay.values()];
    const today = localDay();
    const sum = (from, key) => days.filter((d) => d.day >= from).reduce((a, d) => a + d[key], 0);
    const ago = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return localDay(d);
    };
    res.json({
      today: byDay.get(today) || { day: today, menu_view: 0, qr_scan: 0 },
      week: { menu_view: sum(ago(6), 'menu_view'), qr_scan: sum(ago(6), 'qr_scan') },
      month: { menu_view: sum(ago(29), 'menu_view'), qr_scan: sum(ago(29), 'qr_scan') },
      days,
    });
  });

  // ---- Pano anlık görüntüleri ----
  // Panel dış API'leri kendi çeker (anahtarlar orada kalır) ve sonucu buraya
  // gönderir. Burada tutulur çünkü: tek geçmiş olur, iki bilgisayar aynı
  // seriye yazar ve db-backup.sh data.db ile birlikte yedekler.
  // Bu ölçütlerin geçmişi API'den ALINAMAZ; kaybolursa geri getirilemez.
  router.get('/snapshots', (req, res) => {
    const metric = String(req.query.metric || '');
    if (!isKnownMetric(metric)) return res.status(400).json({ error: 'Bilinmeyen ölçüt.' });

    const GUN = /^\d{4}-\d{2}-\d{2}$/;
    const to = GUN.test(String(req.query.to || '')) ? String(req.query.to) : localDay();
    // Aralık verilmezse son 90 gün; yıllık analiz from/to ile açıkça ister.
    const from = GUN.test(String(req.query.from || ''))
      ? String(req.query.from)
      : localDay(new Date(Date.now() - 89 * 86400000));
    const limit = Math.min(Math.max(Number(req.query.limit) || 5000, 1), 5000);

    // entity parametresi hiç verilmemişse o ölçütün TÜM varlıkları döner
    // (ör. bir günün bütün ürün fiyatları).
    const rows = req.query.entity !== undefined
      ? db
          .prepare(
            `SELECT day, entity, value FROM pano_snapshots
             WHERE metric = ? AND entity = ? AND day BETWEEN ? AND ?
             ORDER BY day ASC LIMIT ?`
          )
          .all(metric, String(req.query.entity), from, to, limit)
      : db
          .prepare(
            `SELECT day, entity, value FROM pano_snapshots
             WHERE metric = ? AND day BETWEEN ? AND ?
             ORDER BY day ASC, entity ASC LIMIT ?`
          )
          .all(metric, from, to, limit);

    res.json({ metric, from, to, rows });
  });

  router.post('/snapshots', (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'Gönderilecek kayıt yok.' });
    if (items.length > 2000) return res.status(413).json({ error: 'Tek seferde en çok 2000 kayıt.' });

    const today = localDay();
    const write = db.prepare(
      `INSERT INTO pano_snapshots (day, metric, entity, value) VALUES (?, ?, ?, ?)
       ON CONFLICT(day, metric, entity) DO UPDATE SET value = excluded.value`
    );

    let yazilan = 0;
    const bilinmeyen = new Set();
    const run = db.transaction((rows) => {
      for (const row of rows) {
        const day = String(row?.day || '');
        const metric = String(row?.metric || '');
        const entity = String(row?.entity ?? '');
        const value = Number(row?.value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
        // Gelecek tarih kabul edilmez: saati yanlış kurulmuş bir istemci
        // seriyi ileri taşıyıp grafiği kalıcı olarak bozabilirdi.
        if (day > today) continue;
        if (!isKnownMetric(metric)) {
          // Panel ayrı depo; ayrışma olursa sessiz kalmasın diye adı bildirilir.
          if (bilinmeyen.size < 10) bilinmeyen.add(metric);
          continue;
        }
        if (!isValidEntity(metric, entity)) continue;
        if (!Number.isFinite(value)) continue;
        write.run(day, metric, entity, value);
        yazilan += 1;
      }
    });
    run(items);

    res.json({ written: yazilan, skipped: items.length - yazilan, unknown: [...bilinmeyen] });
  });

  return router;
}
