import { existsSync } from 'node:fs';
import { isIP } from 'node:net';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import { CONNECTORS, runAll } from './connectors/index.js';
import { RemoteClient } from './remote-client.js';
import { LoginGuard } from './login-guard.js';
import { collectPrices, pullSnapshots, pushSnapshots, syncInBackground } from './snapshots/sync.js';
import { SessionStore, SESSION_COOKIE } from './session-store.js';
import { Translator } from './translate.js';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function requestHostname(req) {
  const raw = String(req.headers.host || '');
  if (raw.startsWith('[')) return raw.slice(0, raw.indexOf(']') + 1);
  return raw.split(':')[0];
}

function isAllowedOrigin(value, config) {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (LOOPBACK_HOSTS.has(url.hostname)) return true;
    return Boolean(config.publicHost) && url.protocol === 'https:' && url.host === config.publicHost;
  } catch {
    return false;
  }
}

function clientAllowed(ip, config) {
  if (!config.allowedIps) return true;
  const address = String(ip || '').replace(/^::ffff:/, '');
  if (LOOPBACK_HOSTS.has(address)) return true;
  const type = isIP(address) === 6 ? 'ipv6' : 'ipv4';
  return isIP(address) > 0 && config.allowedIps.check(address, type);
}

function cookieOptions(config) {
  return {
    httpOnly: true,
    sameSite: 'strict',
    // Alan adında barındırılırken çerez yalnız HTTPS'te gider.
    secure: Boolean(config.publicHost),
    maxAge: config.sessionTtlMs,
    // Ana siteyle aynı alan adında: çerez yalnız panel yoluna gitsin.
    path: config.basePath || '/',
  };
}

function publicSession(session, config) {
  return {
    csrf: session.csrf,
    authenticated: Boolean(session.remoteToken),
    publicMenuUrl: config.publicMenuUrl,
    // Yalnızca BOOLEAN. Anahtarın kendisi tarayıcıya inmez; arayüzün tek
    // ihtiyacı "Çevir" düğmesini çizip çizmeyeceğini bilmek.
    translate: Boolean(config.gemini.apiKey),
  };
}

function errorStatus(error, fallback = 502) {
  const status = Number(error?.status);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : fallback;
}

function securityHeaders(_req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  // Panel ana siteyle aynı alan adında; arama motorları dizinlemesin.
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https://www.yedigulrestorant.com; " +
      "style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; " +
      "object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
  );
  next();
}

export function createApp({
  config,
  cache = null,
  remoteClient = new RemoteClient(config),
  connectors = CONNECTORS,
  translator = new Translator(config),
  distDir = null,
}) {
  const app = express();
  const sessions = new SessionStore(config.sessionTtlMs);
  const loginGuard = new LoginGuard();
  const allowedHosts = new Set(LOOPBACK_HOSTS);
  if (config.publicHost) allowedHosts.add(config.publicHost);

  app.disable('x-powered-by');
  app.locals.basePath = config.basePath;
  // Barındırmada önde aynı makinedeki nginx var; gerçek istemci IP'si onun
  // X-Forwarded-For başlığından okunur. Lokal modda başlığa hiç güvenilmez.
  app.set('trust proxy', config.publicHost ? 'loopback' : false);
  app.use(securityHeaders);
  app.use((req, res, next) => {
    if (!clientAllowed(req.ip, config)) {
      return res.status(403).type('text').send('Erişim yok.');
    }
    if (!allowedHosts.has(requestHostname(req).toLowerCase())) {
      return res.status(403).json({ error: 'Geçersiz Host başlığı.' });
    }
    if (!SAFE_METHODS.has(req.method) && !isAllowedOrigin(req.headers.origin, config)) {
      return res.status(403).json({ error: 'İstek kaynağı reddedildi.' });
    }
    next();
  });
  app.use(cookieParser());
  app.use(express.json({ limit: '512kb', type: ['application/json', 'application/*+json'] }));

  app.use('/local-api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const session = sessions.getOrCreate(req.cookies?.[SESSION_COOKIE]);
    req.localSession = session;
    if (req.cookies?.[SESSION_COOKIE] !== session.id) {
      res.cookie(SESSION_COOKIE, session.id, cookieOptions(config));
    }
    next();
  });

  const csrf = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    if (!sessions.verifyCsrf(req.localSession, req.headers['x-csrf-token'])) {
      return res.status(403).json({ error: 'Güvenlik anahtarı geçersiz. Sayfayı yenileyin.' });
    }
    next();
  };

  app.get('/local-api/bootstrap', (req, res) => {
    res.json(publicSession(req.localSession, config));
  });

  // Pano verisi. Konektörler paralel çalışır ve HER BİRİ kendi durumunu
  // döner; biri düşerse yanıt yine 200'dür, o kartta 'error' yazar. Yalnızca
  // okur — menü değişiklikleri eskisi gibi /local-api/admin üzerinden gider.
  app.get('/local-api/panel', async (req, res) => {
    const session = req.localSession;
    const panels = await runAll(connectors, {
      config,
      cache,
      remoteClient,
      remoteToken: session.remoteToken,
    });
    // Anlık görüntüleri arka planda sunucuya it. Yanıt beklenmez: senkron
    // panoyu geciktirmemeli, hatası da panoyu karartmamalı.
    if (session.remoteToken && cache) {
      syncInBackground({ remoteClient, remoteToken: session.remoteToken, cache });
    }

    res.json({
      authenticated: Boolean(session.remoteToken),
      generatedAt: new Date().toISOString(),
      panels,
    });
  });

  // Elle senkron: kullanıcı bastığında hem taze fiyat toplanır hem sunucuyla
  // iki yönlü eşitlenir. Arka plan senkronunun aksine hata GİZLENMEZ —
  // kullanıcı bir düğmeye bastıysa sonucunu görmeli.
  app.post('/local-api/panel/sync', csrf, async (req, res) => {
    const session = req.localSession;
    if (!session.remoteToken) return res.status(401).json({ error: 'Yönetim oturumu gerekli.' });
    if (!cache) return res.status(503).json({ error: 'Pano önbelleği kapalı.' });

    const ctx = { remoteClient, remoteToken: session.remoteToken, cache };
    try {
      const collected = await collectPrices({ ...ctx, force: true });
      const pushed = await pushSnapshots(ctx);
      const pulled = await pullSnapshots(ctx);
      res.json({ collected, pushed: pushed.written ?? 0, pulled });
    } catch (error) {
      res.status(errorStatus(error, 502)).json({ error: error.message });
    }
  });

  // Çeviri tarayıcıdan DEĞİL buradan çıkar: CSP `connect-src 'self'` sayfanın
  // Google'a çıkmasını engelliyor. Yan fayda: API anahtarı hiç tarayıcıya inmez.
  app.post('/local-api/translate', csrf, async (req, res) => {
    const session = req.localSession;
    if (!session.remoteToken) return res.status(401).json({ error: 'Yönetim oturumu gerekli.' });

    const group = String(req.body?.group || '');
    try {
      const values = await translator.translate(group, req.body?.source);
      res.json({ group, values });
    } catch (error) {
      res.status(errorStatus(error, 502)).json({ error: error.message, hint: error.hint || '' });
    }
  });

  app.post('/local-api/session/login', csrf, async (req, res) => {
    const password = String(req.body?.password || '');
    if (!password) return res.status(400).json({ error: 'Yönetim şifresi gerekli.' });
    const ip = req.ip || 'unknown';
    if (loginGuard.isLocked(ip)) {
      return res.status(429).json({ error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' });
    }
    try {
      req.localSession.remoteToken = await remoteClient.login(password, ip);
      loginGuard.reset(ip);
      res.json({ authenticated: true });
    } catch (error) {
      if (error.status === 401) loginGuard.recordFailure(ip);
      sessions.clearRemoteToken(req.localSession);
      res.status(errorStatus(error, 502)).json({ error: error.message });
    }
  });

  app.post('/local-api/session/logout', csrf, (req, res) => {
    sessions.clearRemoteToken(req.localSession);
    res.json({ authenticated: false });
  });

  app.use('/local-api/admin', csrf, async (req, res) => {
    const session = req.localSession;
    if (!session.remoteToken) return res.status(401).json({ error: 'Yönetim oturumu gerekli.' });
    try {
      const upstream = await remoteClient.proxy(req, session.remoteToken);
      if (upstream.status === 401) sessions.clearRemoteToken(session);
      for (const header of ['content-type', 'content-disposition', 'cache-control']) {
        const value = upstream.headers.get(header);
        if (value) res.setHeader(header, value);
      }
      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.status(upstream.status).send(bytes);
    } catch (error) {
      res.status(errorStatus(error)).json({ error: error.message || 'Uzak sunucuya ulaşılamadı.' });
    }
  });

  app.use('/local-api', (_req, res) => res.status(404).json({ error: 'Lokal API yolu bulunamadı.' }));

  if (distDir && existsSync(distDir)) {
    app.use(express.static(distDir, { index: false, etag: true, maxAge: '1h' }));
    app.get(/.*/, (_req, res) => res.sendFile(join(distDir, 'index.html')));
  } else {
    app.get('/', (_req, res) => res.type('text').send('Yönetim paneli derlenmemiş: npm run build:panel'));
  }

  const pruneTimer = setInterval(() => {
    sessions.prune();
    loginGuard.prune();
  }, 30 * 60 * 1000);
  pruneTimer.unref?.();
  return app;
}

/**
 * Paneli ana uygulamaya /admin/ altında bağlar. Ana uygulamanın gövde
 * ayrıştırıcılarından ÖNCE çağrılmalı: panel kendi sınırlarıyla ayrıştırır,
 * görsel yüklemelerini ise ham akış olarak admin API'sine aktarır.
 */
export function mountPanel(parent, panel, basePath = panel.locals.basePath) {
  parent.get(basePath, (req, res, next) => {
    if (req.path !== basePath) return next();
    res.redirect(301, `${basePath}/`);
  });
  parent.use(basePath, panel);
}

