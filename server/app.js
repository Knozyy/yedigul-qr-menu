import express from 'express';
import cookieParser from 'cookie-parser';
import { getSetting } from './db.js';
import { createMenuRouter } from './routes/menu.js';
import { createAdminRouter } from './routes/admin.js';

export function createApp({ db, uploadsDir, auth }) {
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
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; " +
        "script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; " +
        // Ana sitedeki iletişim haritası OpenStreetMap embed iframe'i kullanır.
        "frame-src 'self' https://www.openstreetmap.org"
    );
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  });

  app.use(express.json());
  app.use(cookieParser());
  if (uploadsDir) app.use('/uploads', express.static(uploadsDir));

  // Dinamik QR hedefi: QR kodu bu sabit /q yolunu içerir; sunucu GÖRELİ
  // yönlendirme yapar, böylece QR hangi domainde açılırsa o domainin menüsüne
  // gider. Menü yolu değişse (ör. /menu/ -> /) sadece bu ayar güncellenir,
  // basılı QR aynı kalır. Domain değişiminde bile aynı QR yeni domainde çalışır.
  const qrRedirect = (req, res) => {
    let path = getSetting(db, 'menu_path', '/menu/') || '/menu/';
    // açık yönlendirme koruması: yalnızca site-içi yollara izin ver.
    // '//host' veya '/\host' protokol-göreli dış yönlendirme olabilir.
    if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
      path = '/menu/';
    }
    res.redirect(302, path);
  };
  app.get('/q', qrRedirect);
  app.get('/qr', qrRedirect);

  app.use('/api/menu', createMenuRouter(db));
  if (auth) {
    app.use('/api/auth', auth.router);
    app.use('/api/admin', createAdminRouter({ db, uploadsDir, requireAuth: auth.requireAuth }));
  }
  return app;
}
