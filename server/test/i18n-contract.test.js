import assert from 'node:assert/strict';
import test from 'node:test';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { readPublicMenu } from '../routes/menu.js';
import { UI, fmtPrice, fmtPriceRange } from '../../src/data/ui.js';
import {
  LANGUAGE_CODES,
  foldForSearch,
  formatItemCount,
  localize,
} from '../../src/lib/i18n.js';

test('TR/EN/AR/RU arayüz sözlükleri aynı ve dolu anahtarları taşır', () => {
  assert.deepEqual(LANGUAGE_CODES, ['tr', 'en', 'ar', 'ru']);
  const expectedKeys = Object.keys(UI.tr).sort();
  for (const code of LANGUAGE_CODES) {
    assert.deepEqual(Object.keys(UI[code]).sort(), expectedKeys, `${code} sözlüğünün anahtarları farklı`);
    for (const [key, value] of Object.entries(UI[code])) {
      assert.equal(typeof value, 'string', `${code}.${key} metin değil`);
      assert.ok(value.trim(), `${code}.${key} boş`);
    }
  }
});

test('istemci yerelleştirmesi seçili dil → EN → TR sırasıyla düşer', () => {
  assert.equal(localize({ tr: 'Balık', en: 'Fish', ar: '', ru: '' }, 'ar'), 'Fish');
  assert.equal(localize({ tr: 'Balık', en: '', ar: '', ru: '' }, 'en'), 'Balık');
  assert.deepEqual(localize({ tr: ['balık'], en: [], ar: [], ru: [] }, 'ru'), ['balık']);
  assert.equal(foldForSearch('РЫБА', 'ru'), 'рыба');
});

test('fiyat ve ürün sayısı seçili dilin biçimini kullanır', () => {
  assert.equal(fmtPrice(1250.5, 'tr'), '1.250,5 TL');
  assert.equal(fmtPriceRange(650, 1100, 'en'), '₺650–1,100');
  assert.equal(formatItemCount(1, 'en'), '1 item');
  assert.equal(formatItemCount(3, 'ru'), '3 позиции');
  assert.equal(formatItemCount(2, 'ar'), 'صنفان');
});

test('canlı API veri üreticisi tüm dilleri doldurur ve gizli ürünü dışlar', () => {
  const db = openDb(':memory:');
  seed(db);
  const row = db.prepare('SELECT id, name_tr FROM products ORDER BY sort LIMIT 1').get();
  db.prepare('UPDATE products SET name_en = ?, name_ar = ?, name_ru = ? WHERE id = ?')
    .run('', '', '', row.id);

  const menu = readPublicMenu(db);
  const product = menu.products.find((item) => item.id === row.id);
  assert.equal(product.name.tr, row.name_tr);
  assert.equal(product.name.en, row.name_tr);
  assert.equal(product.name.ar, row.name_tr);
  assert.equal(product.name.ru, row.name_tr);
  for (const category of menu.categories) {
    for (const code of LANGUAGE_CODES) assert.ok(category[code]);
  }

  db.prepare('UPDATE products SET is_hidden = 1 WHERE id = ?').run(row.id);
  assert.equal(readPublicMenu(db).products.some((item) => item.id === row.id), false);
  db.close();
});
