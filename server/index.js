import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import express from 'express';
import { openDb } from './db.js';
import { seed } from './seed.js';
import { createApp } from './app.js';
import { createAuth } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || join(__dirname, 'uploads');
const DEFAULT_SECRET = 'change-me-in-env';
const SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const IS_PROD = process.env.NODE_ENV === 'production';

if (SECRET === DEFAULT_SECRET) {
  const msg = 'JWT_SECRET ayarlanmamış — bilinen varsayılan kullanılıyor. Admin oturum token\'ları taklit edilebilir.';
  if (IS_PROD) {
    console.error(`HATA: ${msg} Üretimde başlatma iptal edildi.`);
    process.exit(1);
  }
  console.warn(`UYARI: ${msg}`);
}

mkdirSync(UPLOADS_DIR, { recursive: true });

const db = openDb(DB_PATH);
seed(db);
const auth = createAuth({ secret: SECRET, password: PASSWORD });
const app = createApp({ db, uploadsDir: UPLOADS_DIR, auth });

// Ters vekil (nginx) arkasındaysa gerçek istemci IP'sini X-Forwarded-For'dan al,
// böylece giriş hız-sınırı gerçek IP başına çalışır. Varsayılan KAPALI: doğrudan
// internete açık çalıştırıldığında istemci başlığı sahteleyip limiti aşamasın.
// nginx arkasında: .env içinde TRUST_PROXY=1 (tek hop) ayarla.
if (process.env.TRUST_PROXY) {
  const tp = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(tp) ? Number(tp) : tp);
}

// Tek domain düzeni (tek port):
//   /            → ana site (public_html)
//   /menu/…      → canlı menü + yönetim paneli (React build)
//   /menu/admin  → panel (/admin oraya yönlenir)
//   /api, /uploads → API (createApp içinde)
const distDir = resolve(__dirname, '..', 'dist');
const siteDir = resolve(__dirname, '..', 'public_html');

if (existsSync(distDir)) {
  app.use('/menu', express.static(distDir));
  app.get(/^\/menu(\/.*)?$/, (req, res) => res.sendFile(join(distDir, 'index.html')));
}

app.get(/^\/admin(\/.*)?$/, (req, res) => res.redirect('/menu' + req.originalUrl));

if (existsSync(siteDir)) {
  app.use(express.static(siteDir));
}

app.listen(PORT, () => {
  if (!PASSWORD) console.warn('UYARI: ADMIN_PASSWORD boş — admin girişi devre dışı.');
  console.log(`Yedigül API http://localhost:${PORT}`);
});
