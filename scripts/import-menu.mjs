// Mevcut server/data.db'ye server/seed-data.js'teki menüyü uygular.
// - Kategorileri ekler/günceller (isim + sıra).
// - Ürünleri upsert eder: yeni ürün eklenir; var olan ürünün fiyat/gram/kcal/
//   kategori/isim/açıklama/içerik alanları güncellenir. image_url ve is_available
//   KORUNUR (yönetici görsel/aktiflik ayarları ezilmez).
// - Boşalan 'special' kategorisi silinir.
//
// Kullanım: node scripts/import-menu.mjs   (DB_PATH ile başka db verilebilir)
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { openDb } from '../server/db.js';
import { CATEGORIES, ITEMS } from '../server/seed-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || resolve(__dirname, '..', 'server', 'data.db');

const db = openDb(DB_PATH);

const upsertCat = db.prepare(`
  INSERT INTO categories (id, name_tr, name_en, sort, is_active)
  VALUES (@id, @name_tr, @name_en, @sort, 1)
  ON CONFLICT(id) DO UPDATE SET
    name_tr = excluded.name_tr,
    name_en = excluded.name_en,
    sort    = excluded.sort
`);

const upsertProd = db.prepare(`
  INSERT INTO products
    (id, category_id, name_tr, name_en, desc_tr, desc_en, price, is_market_price,
     image_url, is_available, popular, chef, diet, ing_tr, ing_en, alg_tr, alg_en, sort, kcal, portion)
  VALUES
    (@id, @category_id, @name_tr, @name_en, @desc_tr, @desc_en, @price, @is_market_price,
     NULL, 1, @popular, @chef, @diet, @ing_tr, @ing_en, @alg_tr, @alg_en, @sort, @kcal, @portion)
  ON CONFLICT(id) DO UPDATE SET
    category_id     = excluded.category_id,
    name_tr         = excluded.name_tr,
    name_en         = excluded.name_en,
    desc_tr         = excluded.desc_tr,
    desc_en         = excluded.desc_en,
    price           = excluded.price,
    is_market_price = excluded.is_market_price,
    popular         = excluded.popular,
    chef            = excluded.chef,
    diet            = excluded.diet,
    ing_tr          = excluded.ing_tr,
    ing_en          = excluded.ing_en,
    alg_tr          = excluded.alg_tr,
    alg_en          = excluded.alg_en,
    sort            = excluded.sort,
    kcal            = excluded.kcal,
    portion         = excluded.portion
`);

const existingIds = new Set(db.prepare('SELECT id FROM products').all().map((r) => r.id));

const tx = db.transaction(() => {
  CATEGORIES.forEach((c, i) => {
    upsertCat.run({ id: c.id, name_tr: c.tr, name_en: c.en, sort: i });
  });
  ITEMS.forEach((it, i) => {
    upsertProd.run({
      id: it.id,
      category_id: it.cat,
      name_tr: it.name.tr,
      name_en: it.name.en,
      desc_tr: it.desc?.tr ?? '',
      desc_en: it.desc?.en ?? '',
      price: it.price ?? null,
      is_market_price: it.price == null ? 1 : 0,
      popular: it.popular ? 1 : 0,
      chef: it.chef ? 1 : 0,
      diet: JSON.stringify(it.diet ?? []),
      ing_tr: JSON.stringify(it.ing?.tr ?? []),
      ing_en: JSON.stringify(it.ing?.en ?? []),
      alg_tr: JSON.stringify(it.alg?.tr ?? []),
      alg_en: JSON.stringify(it.alg?.en ?? []),
      sort: i,
      kcal: it.kcal ?? null,
      portion: it.portion ?? null,
    });
  });
  // Menüde artık kullanılmayan boş kategorileri (örn. 'special') temizle
  const keep = new Set(CATEGORIES.map((c) => c.id));
  const orphans = db.prepare('SELECT id FROM categories').all().map((r) => r.id).filter((id) => !keep.has(id));
  for (const id of orphans) {
    const n = db.prepare('SELECT COUNT(*) n FROM products WHERE category_id = ?').get(id).n;
    if (n === 0) db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
});
tx();

const added = ITEMS.filter((it) => !existingIds.has(it.id)).length;
const updated = ITEMS.length - added;
console.log(`İçe aktarıldı: ${CATEGORIES.length} kategori, ${ITEMS.length} ürün (${added} yeni, ${updated} güncellendi).`);
const cats = db.prepare('SELECT c.id, c.name_tr, COUNT(p.id) n FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.sort').all();
for (const c of cats) console.log(`  ${c.name_tr}: ${c.n} ürün`);
