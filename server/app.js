import express from 'express';
import cookieParser from 'cookie-parser';
import { getSetting } from './db.js';
import { createMenuRouter } from './routes/menu.js';
import { createAdminRouter } from './routes/admin.js';

export function createApp({ db, uploadsDir, auth }) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  if (uploadsDir) app.use('/uploads', express.static(uploadsDir));

  // Dinamik QR hedefi: QR kodu bu sabit /q yolunu içerir; sunucu GÖRELİ
  // yönlendirme yapar, böylece QR hangi domainde açılırsa o domainin menüsüne
  // gider. Menü yolu değişse (ör. /menu/ -> /) sadece bu ayar güncellenir,
  // basılı QR aynı kalır. Domain değişiminde bile aynı QR yeni domainde çalışır.
  const qrRedirect = (req, res) => {
    const path = getSetting(db, 'menu_path', '/menu/') || '/menu/';
    res.redirect(302, path);
  };
  app.get('/q', qrRedirect);
  app.get('/qr', qrRedirect);

  app.use('/api/menu', createMenuRouter(db));
  if (auth) {
    app.use('/api/auth', auth.router);
    app.use('/api/admin', createAdminRouter({ db, uploadsDir, requireAuth: auth.requireAuth }));
  }
  app.set('appDeps', { db, uploadsDir, auth });
  return app;
}
