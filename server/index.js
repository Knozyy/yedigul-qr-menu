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
const SECRET = process.env.JWT_SECRET || 'change-me-in-env';
const PASSWORD = process.env.ADMIN_PASSWORD || '';

mkdirSync(UPLOADS_DIR, { recursive: true });

const db = openDb(DB_PATH);
seed(db);
const auth = createAuth({ secret: SECRET, password: PASSWORD });
const app = createApp({ db, uploadsDir: UPLOADS_DIR, auth });

// production: serve built frontend
const distDir = resolve(__dirname, '..', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(join(distDir, 'index.html')));
}

app.listen(PORT, () => {
  if (!PASSWORD) console.warn('UYARI: ADMIN_PASSWORD boş — admin girişi devre dışı.');
  console.log(`Yedigül API http://localhost:${PORT}`);
});
