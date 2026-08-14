import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, canSubmitFeedback, insertFeedback } from '../db.js';

const cihaz = (etiket) => `${etiket}-${Math.random()}`;

test('şema: feedback tablosu oluşur', () => {
  const db = openDb(':memory:');
  const tablolar = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
  assert.ok(tablolar.includes('feedback'));
});

test('insertFeedback kaydı yazar, varsayılan okunmamıştır', () => {
  const db = openDb(':memory:');
  const id = insertFeedback(db, { rating: 2, message: 'servis yavaştı', lang: 'tr', deviceId: cihaz('yaz') });
  const satir = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
  assert.equal(satir.rating, 2);
  assert.equal(satir.message, 'servis yavaştı');
  assert.equal(satir.lang, 'tr');
  assert.equal(satir.is_read, 0);
  assert.ok(satir.created_at > 0);
});

test('cihaz başına 24 saatte 3 kayıt sınırı', () => {
  const db = openDb(':memory:');
  const dev = cihaz('limit');
  for (let i = 0; i < 3; i += 1) {
    assert.equal(canSubmitFeedback(db, dev), true, `${i}. gönderim serbest olmalı`);
    insertFeedback(db, { rating: 1, message: `not ${i}`, lang: 'tr', deviceId: dev });
  }
  assert.equal(canSubmitFeedback(db, dev), false, '4. gönderim engellenmeli');
  assert.equal(canSubmitFeedback(db, cihaz('baska')), true, 'başka cihaz etkilenmemeli');
});

test('pencere dolunca cihaz yeniden gönderebilir, eski kayıtlar SİLİNMEZ', () => {
  const db = openDb(':memory:');
  const dev = cihaz('pencere');
  for (let i = 0; i < 3; i += 1) {
    insertFeedback(db, { rating: 1, message: `not ${i}`, lang: 'tr', deviceId: dev });
  }
  db.prepare('UPDATE feedback SET created_at = ? WHERE device_id = ?')
    .run(Date.now() - 25 * 60 * 60 * 1000, dev);

  assert.equal(canSubmitFeedback(db, dev), true);
  assert.equal(
    db.prepare('SELECT COUNT(*) c FROM feedback WHERE device_id = ?').get(dev).c,
    3,
    'geri bildirim veridir; pencere dışı kayıtlar sayaç gibi budanmaz',
  );
});
