import express from 'express';
import cookieParser from 'cookie-parser';
import { getSetting, bumpStat } from './db.js';
import { createMenuRouter } from './routes/menu.js';
import { createAdminRouter } from './routes/admin.js';

export function createApp({ db, uploadsDir, auth, mode = 'full' }) {
  if (!['full', 'public', 'private'].includes(mode)) {
    throw new Error(`Geçersiz uygulama modu: ${mode}`);
  }
  const publicEnabled = mode !== 'private';
  const adminEnabled = mode !== 'public';
  if (mode === 'private' && !auth) {
    throw new Error('Private mod için yönetim kimlik doğrulaması zorunludur.');
  }

  const app = express();

  // Güvenlik başlıkları (helmet'e gerek kalmadan, tek yerde).
  // CSP: SPA 'self' modül scriptleriyle çalışır; QR yazdırma inline script
  // kullanmaz (QrPanel img.onload ile print eder), bu yüzden script-src 'self' yeterli.
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' data: https://fonts.gstatic.com; " +
        "script-src 'self' 'sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw='; " +
        "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; " +
        // Konum haritaları (ana sayfa + /nasil-gelinir/) Yandex Haritalar widget'ı
        // kullanır; yandex.com.tr yönlenebildiği için .com ve .ru de eklendi.
        "frame-src 'self' https://yandex.com.tr https://yandex.com https://yandex.ru"
    );
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  });

  app.use(express.json());
  app.use(cookieParser());
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  if (publicEnabled && uploadsDir) app.use('/uploads', express.static(uploadsDir));

  // Dinamik QR hedefi: QR kodu bu sabit /q yolunu içerir; sunucu GÖRELİ
  // yönlendirme yapar, böylece QR hangi domainde açılırsa o domainin menüsüne
  // gider. Menü yolu değişse (ör. /menu/ -> /) sadece bu ayar güncellenir,
  // basılı QR aynı kalır. Domain değişiminde bile aynı QR yeni domainde çalışır.
  const qrRedirect = (req, res) => {
    bumpStat(db, 'qr_scan');
    let path = getSetting(db, 'menu_path', '/menu/') || '/menu/';
    // açık yönlendirme koruması: yalnızca site-içi yollara izin ver.
    // '//host' veya '/\host' protokol-göreli dış yönlendirme olabilir.
    if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
      path = '/menu/';
    }
    res.redirect(302, path);
  };
  if (publicEnabled) {
    app.get('/q', qrRedirect);
    app.get('/qr', qrRedirect);
    app.use('/api/menu', createMenuRouter(db));
  }
  if (adminEnabled && auth) {
    app.use('/api/auth', auth.router);
    app.use('/api/admin', createAdminRouter({ db, uploadsDir, requireAuth: auth.requireAuth }));
  }
  return app;
}
