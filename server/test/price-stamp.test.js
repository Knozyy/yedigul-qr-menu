import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';
import { createAuth } from '../auth.js';

let server, base, cookie;

before(async () => {
  const db = openDb(':memory:');
  seed(db);
  const auth = createAuth({ secret: 's', password: 'pw' });
  const app = createApp({ db, auth });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'pw' }),
  });
  cookie = login.headers.get('set-cookie');
});

after(() => server.close());

const auth = (extra = {}) => ({ cookie, 'content-type': 'application/json', ...extra });
const menuMeta = async () => (await (await fetch(`${base}/api/menu`)).json()).meta;

test('fresh db has no price stamp', async () => {
  assert.equal((await menuMeta()).price_updated_at, '');
});

test('price change stamps price_updated_at', async () => {
  const res = await fetch(`${base}/api/admin/products/levrek`, {
    method: 'PATCH', headers: auth(), body: JSON.stringify({ price: 700 }),
  });
  assert.equal(res.status, 200);
  const stamp = (await menuMeta()).price_updated_at;
  assert.ok(stamp, 'stamp should be set');
  assert.ok(!Number.isNaN(new Date(stamp).getTime()), 'stamp is a valid date');
});

test('non-price change does not move the stamp', async () => {
  const beforeStamp = (await menuMeta()).price_updated_at;
  await new Promise((r) => setTimeout(r, 5));
  const res = await fetch(`${base}/api/admin/products/levrek`, {
    method: 'PATCH', headers: auth(), body: JSON.stringify({ kcal: 333 }),
  });
  assert.equal(res.status, 200);
  assert.equal((await menuMeta()).price_updated_at, beforeStamp);
});

test('market-price toggle and variant edits stamp too', async () => {
  const beforeStamp = (await menuMeta()).price_updated_at;
  await new Promise((r) => setTimeout(r, 5));
  await fetch(`${base}/api/admin/products/levrek`, {
    method: 'PATCH', headers: auth(), body: JSON.stringify({ is_market_price: 1 }),
  });
  const afterMarket = (await menuMeta()).price_updated_at;
  assert.notEqual(afterMarket, beforeStamp);

  await new Promise((r) => setTimeout(r, 5));
  await fetch(`${base}/api/admin/products/levrek`, {
    method: 'PATCH',
    headers: auth(),
    body: JSON.stringify({ variants: [{ name_tr: 'Porsiyon', name_en: 'Portion', price: 650 }] }),
  });
  assert.notEqual((await menuMeta()).price_updated_at, afterMarket);
});

test('creating a product stamps as well', async () => {
  const beforeStamp = (await menuMeta()).price_updated_at;
  await new Promise((r) => setTimeout(r, 5));
  const res = await fetch(`${base}/api/admin/products`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({ category_id: 'cold', name_tr: 'Damga Test', name_en: 'Stamp Test', price: 10 }),
  });
  assert.equal(res.status, 201);
  assert.notEqual((await menuMeta()).price_updated_at, beforeStamp);
});
