import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, before, after } from 'node:test';
import express from 'express';
import { createApp } from '../app.js';
import { openDb, setSetting } from '../db.js';
import { seed } from '../seed.js';
import { createSiteRouter, createNotFoundHandler, renderPricesHtml } from '../site.js';

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'www');

let server;
let base;
let db;
let uploadsDir;

before(async () => {
  uploadsDir = mkdtempSync(join(tmpdir(), 'yedigul-site-'));
  db = openDb(':memory:');
  seed(db);
  setSetting(db, 'price_updated_at', '2026-11-20T10:00:00.000Z');
  const app = createApp({ db, uploadsDir, mode: 'public' });
  app.use(createSiteRouter({ db, siteDir }));
  app.use(express.static(siteDir));
  const notFound = createNotFoundHandler({ siteDir });
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    notFound(req, res, next);
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  db.close();
  rmSync(uploadsDir, { recursive: true, force: true });
});

const get = (path, headers = {}) => fetch(`${base}${path}`, { headers, redirect: 'manual' });

test('robots.txt Content-Signal bildirir', async () => {
  const body = await (await get('/robots.txt')).text();
  assert.match(body, /^Content-Signal: search=yes, ai-input=yes, ai-train=no$/m);
});

test('sitemap her URL için lastmod verir; fiyat sayfaları son fiyat tarihini alır', async () => {
  const res = await get('/sitemap.xml');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /xml/);
  const xml = await res.text();
  const urls = xml.match(/<url>[\s\S]*?<\/url>/g);
  assert.ok(urls.length >= 8);
  for (const url of urls) assert.match(url, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, url);
  assert.match(xml, /fiyatlar\/<\/loc>\s*<lastmod>2026-11-20<\/lastmod>/);
});

test('olmayan sayfa gerçek 404 döner, ana menüye yönlendirmez', async () => {
  for (const path of ['/yok-boyle-bir-sayfa', '/.well-known/mcp/server-card.json', '/eski/sayfa/']) {
    const res = await get(path, { Accept: 'text/html' });
    assert.equal(res.status, 404, path);
    assert.equal(res.headers.get('location'), null, path);
  }
  const html = await (await get('/yok', { Accept: 'text/html' })).text();
  assert.match(html, /noindex/);
});

test('llms.txt düz metin ve llms.txt biçiminde', async () => {
  const res = await get('/llms.txt');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/plain/);
  const body = await res.text();
  assert.match(body, /^# Yedigül Restaurant\n/);
  assert.match(body, /^> .+/m);
  assert.match(body, /^## .+/m);
  assert.match(body, /^- \[[^\]]+\]\(https:\/\/www\.yedigulrestorant\.com\/[^)]*\)/m);
});

test('ana sayfa Link başlığı llms.txt ve Markdown alternatifini gösterir', async () => {
  const res = await get('/', { Accept: 'text/html' });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const link = res.headers.get('link');
  assert.match(link, /<\/llms\.txt>; rel="describedby"/);
  assert.match(link, /<\/index\.md>; rel="alternate"; type="text\/markdown"/);
  assert.match(link, /^[\x20-\x7e]+$/, 'HTTP başlığı yalnız ASCII olmalı');
  assert.match(res.headers.get('vary'), /Accept/);
});

test('Accept: text/markdown ana sayfa için Markdown döner', async () => {
  const res = await get('/', { Accept: 'text/markdown' });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/markdown/);
  assert.match(await res.text(), /^# Yedigül Restaurant/);
  const browser = await get('/', { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' });
  assert.match(browser.headers.get('content-type'), /text\/html/);
});

test('ana sayfa birden çok şema türü ve hakkımızda/iletişim/fiyat bağlantıları içerir', async () => {
  const html = await (await get('/')).text();
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const types = new Set(blocks.flatMap((b) => (b['@graph'] || [b]).map((n) => n['@type'])));
  for (const t of ['Restaurant', 'Menu', 'WebSite', 'WebPage']) assert.ok(types.has(t), t);
  for (const href of ['hakkimizda/', 'iletisim/', 'fiyatlar/']) assert.match(html, new RegExp(`href="${href}"`));
});

test('hakkımızda ve iletişim sayfaları yayında', async () => {
  for (const path of ['/hakkimizda/', '/iletisim/']) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    assert.match(html, /application\/ld\+json/);
  }
});

test('fiyat sayfası JS olmadan fiyatları ve Offer şemasını verir', async () => {
  const res = await get('/fiyatlar/');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const menu = ld.find((b) => b['@type'] === 'Menu');
  assert.ok(menu, 'Menu şeması');
  const offers = menu.hasMenuSection.flatMap((s) => s.hasMenuItem).flatMap((i) => i.offers || []);
  assert.ok(offers.length > 10);
  for (const o of offers) {
    assert.equal(o['@type'], 'Offer');
    assert.equal(o.priceCurrency, 'TRY');
    assert.equal(typeof o.price, 'number');
  }
  assert.match(html, /₺/);
  assert.equal((await get('/fiyatlar')).status, 301);
});

test('fiyat listesi Markdown olarak da alınır', async () => {
  for (const [path, headers] of [['/fiyatlar.md', {}], ['/fiyatlar/', { Accept: 'text/markdown' }]]) {
    const res = await get(path, headers);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type'), /^text\/markdown/);
    const md = await res.text();
    assert.match(md, /^# Yedigül Restaurant — Menü ve Fiyat Listesi/);
    assert.match(md, /^## .+/m);
    assert.match(md, /^- .+: (\d[\d.]* ₺|Piyasa fiyatı)/m);
  }
});

test('fiyat sayfası ürün adlarını kaçışlar, JSON-LD bloğunu kapatamaz', () => {
  const html = renderPricesHtml({
    updated: '',
    sets: [],
    sections: [{ id: 'x', name: 'Test', items: [{ id: 'a', name: '</script><img src=x onerror=alert(1)>', nameEn: '', desc: '', portion: null, price: 10, variants: [] }] }],
  });
  assert.ok(!html.includes('<img src=x'));
  assert.equal(html.match(/<\/script>/g).length, 3);
});
