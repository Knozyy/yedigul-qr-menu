import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openDb, pruneExpiredData, RETENTION_DAYS, localDay } from '../db.js';
import { seed } from '../seed.js';

const DAY = 24 * 60 * 60 * 1000;

test('2 yıldan eski yorum ve günlük sayaçlar silinir, yeniler kalır', () => {
  const db = openDb(':memory:');
  seed(db);
  const now = Date.UTC(2026, 10, 22, 12);
  const product = db.prepare('SELECT id FROM products LIMIT 1').get().id;
  const oldMs = now - (RETENTION_DAYS + 2) * DAY;
  const newMs = now - (RETENTION_DAYS - 2) * DAY;
  const insertFb = db.prepare('INSERT INTO feedback (rating, message, lang, device_id, created_at) VALUES (2, ?, ?, ?, ?)');
  insertFb.run('eski', 'tr', 'd1', oldMs);
  insertFb.run('yeni', 'tr', 'd2', newMs);
  for (const [ms, n] of [[oldMs, 5], [newMs, 7]]) {
    db.prepare('INSERT INTO stats_daily (day, key, n) VALUES (?, ?, ?)').run(localDay(new Date(ms)), 'menu_view', n);
    db.prepare('INSERT INTO product_views_daily (day, product_id, n) VALUES (?, ?, ?)').run(localDay(new Date(ms)), product, n);
  }

  assert.deepEqual(pruneExpiredData(db, now), { feedback: 1, stats: 1, productViews: 1 });
  assert.deepEqual(db.prepare('SELECT message FROM feedback').all().map((r) => r.message), ['yeni']);
  assert.deepEqual(db.prepare('SELECT n FROM stats_daily').all().map((r) => r.n), [7]);
  assert.deepEqual(db.prepare('SELECT n FROM product_views_daily').all().map((r) => r.n), [7]);
  assert.deepEqual(pruneExpiredData(db, now), { feedback: 0, stats: 0, productViews: 0 });
  db.close();
});
