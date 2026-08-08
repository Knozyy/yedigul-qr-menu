import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { openDb } from '../db.js';
import {
  backfillMenuTranslations,
  MENU_TRANSLATIONS,
} from '../translation-backfill.js';

const parseList = (value) => JSON.parse(value ?? '[]');

test('çeviri kataloğu mevcut menünün tamamını kapsar', (t) => {
  assert.equal(MENU_TRANSLATIONS.categories.length, 12);
  assert.equal(MENU_TRANSLATIONS.products.length, 199);
  assert.equal(new Set(MENU_TRANSLATIONS.categories.map((row) => row.id)).size, 12);
  assert.equal(new Set(MENU_TRANSLATIONS.products.map((row) => row.id)).size, 199);

  for (const row of MENU_TRANSLATIONS.categories) {
    assert.ok(row.name_en.trim(), `${row.id}: name_en boş`);
    assert.ok(row.name_ru.trim(), `${row.id}: name_ru boş`);
    assert.ok(row.name_ar.trim(), `${row.id}: name_ar boş`);
  }
  for (const row of MENU_TRANSLATIONS.products) {
    for (const field of ['name_en', 'name_ru', 'name_ar', 'desc_en', 'desc_ru', 'desc_ar']) {
      assert.ok(row[field].trim(), `${row.id}: ${field} boş`);
    }
  }

  const dir = mkdtempSync(join(tmpdir(), 'yedigul-i18n-'));
  const copy = join(dir, 'data.db');
  copyFileSync(fileURLToPath(new URL('../data.db', import.meta.url)), copy);

  // openDb gerçek dosyanın yalnızca geçici kopyasında idempotent backfill'i çalıştırır.
  const db = openDb(copy);
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const categoryMissing = db.prepare(`
    SELECT COUNT(*) AS n FROM categories
    WHERE trim(name_ru) = '' OR trim(name_ar) = ''
  `).get().n;
  const productMissing = db.prepare(`
    SELECT COUNT(*) AS n FROM products
    WHERE trim(name_ru) = '' OR trim(name_ar) = ''
       OR (trim(desc_en) <> '' AND (trim(desc_ru) = '' OR trim(desc_ar) = ''))
  `).get().n;
  assert.equal(categoryMissing, 0);
  assert.equal(productMissing, 0);

  for (const row of db.prepare(`
    SELECT id, ing_en, ing_ru, ing_ar, alg_en, alg_ru, alg_ar, variants
    FROM products
  `).all()) {
    for (const base of ['ing', 'alg']) {
      const source = parseList(row[`${base}_en`]);
      if (!source.length) continue;
      assert.equal(parseList(row[`${base}_ru`]).length, source.length, `${row.id}: ${base}_ru`);
      assert.equal(parseList(row[`${base}_ar`]).length, source.length, `${row.id}: ${base}_ar`);
    }
    for (const variant of parseList(row.variants)) {
      if (!String(variant.name_en ?? '').trim()) continue;
      assert.ok(String(variant.name_ru ?? '').trim(), `${row.id}: varyant RU boş`);
      assert.ok(String(variant.name_ar ?? '').trim(), `${row.id}: varyant AR boş`);
    }
  }

  const levrek = db.prepare('SELECT name_ru, name_ar, desc_ru, desc_ar FROM products WHERE id = ?').get('levrek');
  assert.equal(levrek.name_ru, 'Сибас на гриле');
  assert.equal(levrek.name_ar, 'سمك القاروص المشوي');
  assert.notEqual(levrek.desc_ru, levrek.desc_ar);
});

test('backfill elle girilmiş çevirileri korur ve ikinci çalıştırmada değişiklik yapmaz', () => {
  const db = openDb(':memory:');
  db.prepare(`
    INSERT INTO categories (id, name_tr, name_en, name_ru, name_ar, sort)
    VALUES ('fish', 'Balık', 'Fresh Fish', 'Manuel kategori', '', 0)
  `).run();
  db.prepare(`
    INSERT INTO products (
      id, category_id, name_tr, name_en, name_ru, name_ar,
      desc_tr, desc_en, desc_ru, desc_ar,
      ing_en, ing_ru, ing_ar, alg_en, alg_ru, alg_ar, variants
    ) VALUES (
      'levrek', 'fish', 'Izgara Levrek', 'Grilled Sea Bass', 'Manuel ürün', '',
      'Günlük taze levrek.', 'Daily-fresh sea bass over charcoal.', 'Manuel açıklama', '',
      '["Sea bass","Olive oil"]', '["Manuel malzeme"]', '[]',
      '["Fish"]', '[]', '[]',
      '[{"name_tr":"Tek","name_en":"Tek","name_ru":"Manuel varyant","name_ar":"","price":300}]'
    )
  `).run();

  backfillMenuTranslations(db);
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get('fish');
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get('levrek');
  assert.equal(category.name_ru, 'Manuel kategori');
  assert.equal(category.name_ar, 'الأسماك الطازجة');
  assert.equal(product.name_ru, 'Manuel ürün');
  assert.equal(product.desc_ru, 'Manuel açıklama');
  assert.deepEqual(parseList(product.ing_ru), ['Manuel malzeme']);
  assert.deepEqual(parseList(product.ing_ar), ['قاروص البحر', 'زيت الزيتون']);
  assert.deepEqual(parseList(product.alg_ru), ['Рыба']);
  assert.deepEqual(parseList(product.alg_ar), ['السمك']);
  const [variant] = parseList(product.variants);
  assert.equal(variant.name_ru, 'Manuel varyant');
  assert.equal(variant.name_ar, 'جرعة مفردة');

  assert.deepEqual(backfillMenuTranslations(db), {
    categories: 0,
    products: 0,
    lists: 0,
    variants: 0,
  });
  db.close();
});

test('İngilizce kaynak değişmişse eski katalog çevirisi uygulanmaz', () => {
  const db = openDb(':memory:');
  db.prepare(`
    INSERT INTO categories (id, name_tr, name_en, name_ru, name_ar, sort)
    VALUES ('fish', 'Balık', 'Edited category', '', '', 0)
  `).run();
  db.prepare(`
    INSERT INTO products (id, category_id, name_tr, name_en, desc_tr, desc_en)
    VALUES ('levrek', 'fish', 'Izgara Levrek', 'Edited product', 'Yeni açıklama', 'Edited description')
  `).run();

  backfillMenuTranslations(db);
  const category = db.prepare('SELECT name_ru, name_ar FROM categories WHERE id = ?').get('fish');
  const product = db.prepare('SELECT name_ru, name_ar, desc_ru, desc_ar FROM products WHERE id = ?').get('levrek');
  assert.deepEqual(category, { name_ru: '', name_ar: '' });
  assert.deepEqual(product, { name_ru: '', name_ar: '', desc_ru: '', desc_ar: '' });
  db.close();
});
