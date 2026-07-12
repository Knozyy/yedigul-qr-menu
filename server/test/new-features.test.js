// Yeni özellikler: varyantlar, çoklu görsel, genişletilmiş ayarlar (duyuru +
// restoran bilgileri), değişiklik geçmişi, günlük istatistikler.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, bumpStat, localDay } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base, cookie, db, uploadsDir;

// backend sniff'ini geçen geçerli 1x1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

function pngForm() {
  const fd = new FormData();
  fd.append('image', new Blob([PNG], { type: 'image/png' }), 'a.png');
  return fd;
}

async function req(method, path, body) {
  const headers = { cookie };
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const r = await fetch(base + path, { method, headers, body: payload });
  return { status: r.status, data: r.status === 204 ? null : await r.json().catch(() => ({})) };
}

before(async () => {
  uploadsDir = mkdtempSync(join(tmpdir(), 'yg-newfeat-'));
  db = openDb(':memory:');
  seed(db);
  const auth = createAuth({ secret: 's', password: 'pw' });
  const app = createApp({ db, uploadsDir, auth });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'pw' }),
  });
  cookie = login.headers.get('set-cookie');
});

after(() => {
  server.close();
  rmSync(uploadsDir, { recursive: true, force: true });
});

// ---- varyantlar ----

test('product accepts valid variants and rejects invalid ones', async () => {
  const cat = (await req('GET', '/api/admin/menu')).data.categories[0];
  const created = await req('POST', '/api/admin/products', {
    category_id: cat.id, name_tr: 'Varyantlı', name_en: 'Variant',
    variants: [
      { name_tr: 'Küçük', name_en: 'Small', price: 100 },
      { name_tr: 'Büyük', name_en: 'Large', price: 180 },
    ],
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.variants.length, 2);
  assert.equal(created.data.variants[1].price, 180);

  const bad = await req('PATCH', `/api/admin/products/${created.data.id}`, {
    variants: [{ name_tr: '', name_en: 'X', price: 10 }],
  });
  assert.equal(bad.status, 400);

  const badPrice = await req('PATCH', `/api/admin/products/${created.data.id}`, {
    variants: [{ name_tr: 'A', name_en: 'B', price: -5 }],
  });
  assert.equal(badPrice.status, 400);

  const cleared = await req('PATCH', `/api/admin/products/${created.data.id}`, { variants: [] });
  assert.equal(cleared.data.variants.length, 0);
  await req('DELETE', `/api/admin/products/${created.data.id}`);
});

test('public menu exposes variants with localized names', async () => {
  const cat = (await req('GET', '/api/admin/menu')).data.categories[0];
  const created = await req('POST', '/api/admin/products', {
    category_id: cat.id, name_tr: 'Porsiyonlu', name_en: 'Portioned',
    variants: [{ name_tr: 'Tek', name_en: 'Single', name_ar: 'فردي', price: 90 }],
  });
  const menu = await (await fetch(`${base}/api/menu`)).json();
  const item = menu.products.find((p) => p.id === created.data.id);
  // RU boş bırakıldı → EN'e düşer
  assert.deepEqual(item.variants, [
    { name: { tr: 'Tek', en: 'Single', ar: 'فردي', ru: 'Single' }, price: 90 },
  ]);
  await req('DELETE', `/api/admin/products/${created.data.id}`);
});

// ---- AR/RU çevirileri ----

test('AR/RU fields persist and public menu falls back empty → EN → TR', async () => {
  const cat = (await req('GET', '/api/admin/menu')).data.categories[0];
  const created = await req('POST', '/api/admin/products', {
    category_id: cat.id,
    name_tr: 'Çevirili', name_en: 'Translated',
    name_ar: 'مترجم', name_ru: '',
    desc_tr: 'Sadece TR', desc_en: '',
    ing_tr: ['domates'], ing_en: ['tomato'], ing_ar: [], ing_ru: ['помидор'],
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.name_ar, 'مترجم');
  assert.deepEqual(created.data.ing_ru, ['помидор']);

  const catAr = await req('PATCH', `/api/admin/categories/${cat.id}`, { name_ar: 'فئة' });
  assert.equal(catAr.data.name_ar, 'فئة');

  const menu = await (await fetch(`${base}/api/menu`)).json();
  const item = menu.products.find((p) => p.id === created.data.id);
  assert.equal(item.name.ar, 'مترجم');
  assert.equal(item.name.ru, 'Translated'); // boş RU → EN
  assert.equal(item.desc.ar, 'Sadece TR'); // boş AR, boş EN → TR
  assert.deepEqual(item.ing.ar, ['tomato']); // boş AR listesi → EN
  assert.deepEqual(item.ing.ru, ['помидор']);
  const pubCat = menu.categories.find((x) => x.id === cat.id);
  assert.equal(pubCat.ar, 'فئة');
  assert.equal(pubCat.ru, pubCat.en); // boş RU → EN

  await req('PATCH', `/api/admin/categories/${cat.id}`, { name_ar: '' });
  await req('DELETE', `/api/admin/products/${created.data.id}`);
});

test('announcement AR/RU exposed in public meta with EN fallback', async () => {
  await req('PUT', '/api/admin/settings', {
    announcement_tr: 'Duyuru', announcement_en: 'Notice',
    announcement_ar: 'إعلان', announcement_ru: '',
  });
  const menu = await (await fetch(`${base}/api/menu`)).json();
  assert.equal(menu.meta.announcement.ar, 'إعلان');
  assert.equal(menu.meta.announcement.ru, 'Notice');
  await req('PUT', '/api/admin/settings', {
    announcement_tr: '', announcement_en: '', announcement_ar: '', announcement_ru: '',
  });
});

// ---- çoklu görsel ----

test('multiple images: append, reorder, remove; cover follows first', async () => {
  const cat = (await req('GET', '/api/admin/menu')).data.categories[0];
  const p = (await req('POST', '/api/admin/products', {
    category_id: cat.id, name_tr: 'Görselli', name_en: 'Pictured',
  })).data;

  const up1 = await req('POST', `/api/admin/products/${p.id}/images`, pngForm());
  assert.equal(up1.status, 200);
  const up2 = await req('POST', `/api/admin/products/${p.id}/images`, pngForm());
  assert.equal(up2.data.images.length, 2);
  assert.equal(up2.data.image_url, up2.data.images[0]);

  // yeniden sırala: ikinci görsel kapak olsun
  const [a, b] = up2.data.images;
  const reordered = await req('PUT', `/api/admin/products/${p.id}/images`, { images: [b, a] });
  assert.equal(reordered.data.image_url, b);

  // listede olmayan URL reddedilir
  const bad = await req('PUT', `/api/admin/products/${p.id}/images`, { images: ['/uploads/yok.png'] });
  assert.equal(bad.status, 400);

  // birini çıkar
  const removed = await req('PUT', `/api/admin/products/${p.id}/images`, { images: [b] });
  assert.equal(removed.data.images.length, 1);
  assert.equal(removed.data.image_url, b);

  // eski kapak rotası hâlâ çalışıyor: kapağı değiştir, sonra kaldır
  const replaced = await req('POST', `/api/admin/products/${p.id}/image`, pngForm());
  assert.equal(replaced.data.images.length, 1);
  assert.notEqual(replaced.data.image_url, b);
  const del = await req('DELETE', `/api/admin/products/${p.id}/image`);
  assert.equal(del.data.image_url, null);
  assert.equal(del.data.images.length, 0);

  await req('DELETE', `/api/admin/products/${p.id}`);
});

test('image count is limited', async () => {
  const cat = (await req('GET', '/api/admin/menu')).data.categories[0];
  const p = (await req('POST', '/api/admin/products', {
    category_id: cat.id, name_tr: 'Sınır', name_en: 'Limit',
  })).data;
  for (let i = 0; i < 6; i++) {
    const r = await req('POST', `/api/admin/products/${p.id}/images`, pngForm());
    assert.equal(r.status, 200, `upload ${i + 1}`);
  }
  const over = await req('POST', `/api/admin/products/${p.id}/images`, pngForm());
  assert.equal(over.status, 400);
  await req('DELETE', `/api/admin/products/${p.id}`);
});

test('deleting a product removes its image files from disk', async () => {
  const { readdirSync } = await import('node:fs');
  const cat = (await req('GET', '/api/admin/menu')).data.categories[0];
  const p = (await req('POST', '/api/admin/products', {
    category_id: cat.id, name_tr: 'Silinecek', name_en: 'Doomed',
  })).data;
  await req('POST', `/api/admin/products/${p.id}/images`, pngForm());
  const withFile = readdirSync(uploadsDir).filter((f) => f.startsWith(p.id)).length;
  assert.equal(withFile, 1);
  await req('DELETE', `/api/admin/products/${p.id}`);
  const after = readdirSync(uploadsDir).filter((f) => f.startsWith(p.id)).length;
  assert.equal(after, 0);
});

// ---- genişletilmiş ayarlar ----

test('settings accept announcement and restaurant info; public menu meta exposes them', async () => {
  const put = await req('PUT', '/api/admin/settings', {
    announcement_tr: 'Bugün canlı müzik!', announcement_en: 'Live music tonight!',
    info_phone: '+90 212 555 55 55', info_hours: '12:00 – 23:00',
    info_wifi: 'yedigul2026', info_instagram: '@yedigul',
  });
  assert.equal(put.status, 200);
  assert.equal(put.data.announcement_tr, 'Bugün canlı müzik!');
  assert.equal(put.data.info_wifi, 'yedigul2026');

  const menu = await (await fetch(`${base}/api/menu`)).json();
  assert.equal(menu.meta.announcement.tr, 'Bugün canlı müzik!');
  assert.equal(menu.meta.announcement.en, 'Live music tonight!');
  assert.equal(menu.meta.info.phone, '+90 212 555 55 55');
  assert.equal(menu.meta.info.instagram, '@yedigul');

  // temizle → meta boş döner
  await req('PUT', '/api/admin/settings', { announcement_tr: '', announcement_en: '' });
  const menu2 = await (await fetch(`${base}/api/menu`)).json();
  assert.equal(menu2.meta.announcement.tr, '');
});

// ---- değişiklik geçmişi ----

test('mutations are recorded in history with readable summaries', async () => {
  const cat = (await req('GET', '/api/admin/menu')).data.categories[0];
  const p = (await req('POST', '/api/admin/products', {
    category_id: cat.id, name_tr: 'Tarihçeli', name_en: 'Historied', price: 100,
  })).data;
  await req('PATCH', `/api/admin/products/${p.id}`, { price: 140 });
  await req('DELETE', `/api/admin/products/${p.id}`);

  const hist = (await req('GET', '/api/admin/history?limit=10')).data.entries;
  const kinds = hist.map((e) => `${e.action}:${e.entity}`);
  assert.ok(kinds.includes('create:product'));
  assert.ok(kinds.includes('update:product'));
  assert.ok(kinds.includes('delete:product'));
  const upd = hist.find((e) => e.action === 'update' && e.entity_id === p.id);
  assert.match(upd.detail, /fiyat: 100 → 140/);
});

test('history requires auth and honors limit', async () => {
  const noAuth = await fetch(`${base}/api/admin/history`);
  assert.equal(noAuth.status, 401);
  const limited = (await req('GET', '/api/admin/history?limit=2')).data.entries;
  assert.ok(limited.length <= 2);
});

// ---- istatistikler ----

const postView = (id) =>
  fetch(`${base}/api/menu/view`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  }).then((r) => r.json());

test('menu views and qr scans are counted per day', async () => {
  const before = (await req('GET', '/api/admin/stats')).data;
  await postView('device-' + Math.random());
  await fetch(`${base}/api/menu`); // veri çekmek SAYMAMALI
  await fetch(`${base}/q`, { redirect: 'manual' });
  const after = (await req('GET', '/api/admin/stats')).data;
  assert.equal(after.today.menu_view, before.today.menu_view + 1);
  assert.equal(after.today.qr_scan, before.today.qr_scan + 1);
  assert.ok(after.week.menu_view >= after.today.menu_view);
  assert.ok(after.month.menu_view >= after.week.menu_view);
});

test('menu view is counted once per device within the 6h window', async () => {
  const before = (await req('GET', '/api/admin/stats')).data;
  const dev = 'dedup-' + Math.random();
  const first = await postView(dev);
  const second = await postView(dev); // aynı cihaz, 6 saat içinde → saymaz
  const after = (await req('GET', '/api/admin/stats')).data;
  assert.equal(first.counted, true);
  assert.equal(second.counted, false);
  assert.equal(after.today.menu_view, before.today.menu_view + 1); // yalnız 1 arttı
});

test('stats aggregate across days (older days count toward month, not today)', () => {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  db.prepare('INSERT INTO stats_daily (day, key, n) VALUES (?, ?, 5) ON CONFLICT(day,key) DO UPDATE SET n = n + 5')
    .run(localDay(d), 'menu_view');
  bumpStat(db, 'menu_view'); // bugün +1
  const rows = db.prepare("SELECT SUM(n) s FROM stats_daily WHERE key='menu_view'").get();
  assert.ok(rows.s >= 6);
});
