import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { after, before, test } from 'node:test';
import express from 'express';
import { createApp, mountPanel } from '../../panel/app.js';
import { loadConfig } from '../../panel/config.js';

// www.yedigulrestorant.com/admin/: panel admin API'siyle aynı süreçte, nginx arkasında.
const HOST = 'www.yedigulrestorant.com';
const BASE = '/admin';
const STAFF_IP = '203.0.113.10';

let remoteServer;
let localServer;
let port;
const seenForwardedFor = [];
let seenAdminPath = '';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

// fetch Host başlığını ezer; Host kontrolünü sınamak için düz node:http.
function request(method, path, headers = {}, body = undefined) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port, method, path, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, headers: res.headers, json: () => JSON.parse(text) });
      });
    });
    req.on('error', reject);
    req.end(body);
  });
}

before(async () => {
  const remote = express();
  remote.use(express.json());
  remote.post('/api/auth/login', (req, res) => {
    seenForwardedFor.push(req.headers['x-forwarded-for']);
    if (req.body.password !== 'dogru-sifre') return res.status(401).json({ error: 'Hatalı şifre' });
    res.json({ authenticated: true, token: 'remote-test-token' });
  });
  remote.get('/api/admin/menu', (req, res) => {
    seenAdminPath = req.originalUrl;
    if (req.headers.authorization !== 'Bearer remote-test-token') return res.status(401).json({ error: 'Yetkisiz' });
    res.json({ products: [{ id: 'levrek' }] });
  });
  remoteServer = await listen(remote);
  const remotePort = remoteServer.address().port;
  const config = loadConfig({
    PUBLIC_HOST: HOST,
    ALLOWED_IPS: '203.0.113.0/24, 198.51.100.7',
    REMOTE_ADMIN_BASE_URL: `http://127.0.0.1:${remotePort}`,
  });
  // Sunucudaki gibi: panel ana uygulamaya /admin altında bağlanır.
  const root = express();
  mountPanel(root, createApp({ config }));
  root.use((_req, res) => res.status(404).end());
  localServer = await listen(root);
  port = localServer.address().port;
});

after(async () => {
  await Promise.all([close(localServer), close(remoteServer)]);
});

async function bootstrap(clientIp = STAFF_IP) {
  const response = await request('GET', `${BASE}/local-api/bootstrap`, { host: HOST, 'x-forwarded-for': clientIp });
  return {
    response,
    cookie: response.headers['set-cookie'][0].split(';')[0],
    csrf: response.json().csrf,
  };
}

function login({ cookie, csrf }, clientIp, password) {
  return request('POST', `${BASE}/local-api/session/login`, {
    host: HOST,
    origin: `https://${HOST}`,
    'x-forwarded-for': clientIp,
    cookie,
    'content-type': 'application/json',
    'x-csrf-token': csrf,
  }, JSON.stringify({ password }));
}

test('barındırma ayarlarını doğrular', () => {
  assert.throws(() => loadConfig({ PUBLIC_HOST: 'https://www.example.com/', ALLOWED_IPS: '1.2.3.4' }), /PUBLIC_HOST/);
  assert.throws(() => loadConfig({ PUBLIC_HOST: HOST }), /ALLOWED_IPS/);
  assert.throws(() => loadConfig({ ALLOWED_IPS: '1.2.3' }), /geçersiz adres/);
  assert.throws(() => loadConfig({ ALLOWED_IPS: '1.2.3.0/40' }), /geçersiz ağ/);
  assert.throws(() => loadConfig({ REMOTE_ADMIN_BASE_URL: 'https://example.com' }), /loopback/);
  assert.equal(loadConfig({}, { selfPort: 3002 }).remoteAdminBaseUrl, 'http://127.0.0.1:3002');
});

test('panel yolu altında açılır; çerez Secure ve yalnız /admin yolunda', async () => {
  const { response } = await bootstrap();
  assert.equal(response.status, 200);
  const cookie = response.headers['set-cookie'][0];
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /Path=\/admin(;|$)/);
});

test('/admin sondaki eğik çizgiye yönlenir, panel dışı yollar 404', async () => {
  const redirect = await request('GET', BASE, { host: HOST, 'x-forwarded-for': STAFF_IP });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.location, `${BASE}/`);
  assert.equal((await request('GET', '/local-api/bootstrap', { host: HOST, 'x-forwarded-for': STAFF_IP })).status, 404);
});

test('izinli olmayan IP yi reddeder', async () => {
  const response = await request('GET', `${BASE}/local-api/bootstrap`, { host: HOST, 'x-forwarded-for': '192.0.2.50' });
  assert.equal(response.status, 403);
});

test('başka Host başlığını reddeder', async () => {
  const response = await request('GET', `${BASE}/local-api/bootstrap`, { host: 'evil.example', 'x-forwarded-for': STAFF_IP });
  assert.equal(response.status, 403);
});

test('alan adının http kökenini ve yabancı kökeni reddeder', async () => {
  for (const origin of [`http://${HOST}`, 'https://evil.example']) {
    const response = await request('POST', `${BASE}/local-api/session/login`, {
      host: HOST, origin, 'x-forwarded-for': STAFF_IP, 'content-type': 'application/json',
    }, JSON.stringify({ password: 'dogru-sifre' }));
    assert.equal(response.status, 403, origin);
  }
});

test('gerçek istemci IP sini iletir; yönetim istekleri doğru uzak yola gider', async () => {
  const session = await bootstrap('203.0.113.2');
  assert.equal((await login(session, '203.0.113.2', 'dogru-sifre')).status, 200);
  assert.equal(seenForwardedFor.at(-1), '203.0.113.2');

  const menu = await request('GET', `${BASE}/local-api/admin/menu`, {
    host: HOST, 'x-forwarded-for': '203.0.113.2', cookie: session.cookie,
  });
  assert.equal(menu.status, 200);
  assert.equal(seenAdminPath, '/api/admin/menu');
});

test('hatalı girişleri IP başına kilitler, başka IP etkilenmez', async () => {
  const attacker = await bootstrap('198.51.100.7');
  for (let i = 0; i < 5; i += 1) {
    assert.equal((await login(attacker, '198.51.100.7', 'yanlis')).status, 401);
  }
  assert.equal((await login(attacker, '198.51.100.7', 'dogru-sifre')).status, 429);

  const staff = await bootstrap('203.0.113.3');
  assert.equal((await login(staff, '203.0.113.3', 'dogru-sifre')).status, 200);
});
