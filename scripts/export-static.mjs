// Statik menü dışa aktarımı: SQLite'taki menüyü dist-menu/ içine
// menu-data.json + uploads/ olarak yazar. `npm run export:menu` bunu
// vite build'den sonra çalıştırır; çıkan klasör www/menu/ olur.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync, writeFileSync, existsSync, readdirSync, copyFileSync, statSync, rmSync, mkdtempSync } from 'node:fs';
import Database from 'better-sqlite3';

// fs.cpSync bu ortamda (Node 25 + non-ASCII yol) native crash veriyor;
// readdir + copyFile ile güvenli özyinelemeli kopya
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = join(src, name);
    const d = join(dest, name);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}
import { openDb } from '../server/db.js';
import { seed } from '../server/seed.js';
import { readPublicMenu } from '../server/routes/menu.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const DB_PATH = process.env.DB_PATH || join(root, 'server', 'data.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || join(root, 'server', 'uploads');
const OUT_DIR = join(root, 'dist-menu');

async function openExportDb(path) {
  if (existsSync(path)) {
    // Export sırasında migration gerekse bile gerçek menü veritabanına yazma.
    // SQLite backup WAL'daki son değişiklikleri de geçici kopyaya taşır.
    const tempDir = mkdtempSync(join(tmpdir(), 'yedigul-menu-export-'));
    const tempDbPath = join(tempDir, 'data.db');
    const source = new Database(path, { readonly: true, fileMustExist: true });
    try {
      await source.backup(tempDbPath);
    } finally {
      source.close();
    }
    let copy;
    try {
      copy = openDb(tempDbPath);
      seed(copy);
    } catch (error) {
      copy?.close();
      rmSync(tempDir, { recursive: true, force: true });
      throw error;
    }
    return {
      db: copy,
      cleanup: () => {
        copy.close();
        rmSync(tempDir, { recursive: true, force: true });
      },
    };
  }

  const writable = openDb(path);
  seed(writable); // boş db ise seed-data.js'ten doldur
  return { db: writable, cleanup: () => writable.close() };
}

const { db, cleanup } = await openExportDb(DB_PATH);
try {
  const menu = readPublicMenu(db);

  // /uploads/x.jpg -> uploads/x.jpg (paket içi göreli yol; /menu/ altında çözülür)
  const stripSlash = (u) => (u ? u.replace(/^\//, '') : u);
  const products = menu.products.map((p) => ({
    ...p,
    image_url: p.image_url ? stripSlash(p.image_url) : null,
    images: p.images.map(stripSlash),
  }));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, 'menu-data.json'),
    JSON.stringify({ ...menu, products })
  );

  if (existsSync(UPLOADS_DIR)) {
    copyDir(UPLOADS_DIR, join(OUT_DIR, 'uploads'));
  }

  console.log(`menu-data.json yazıldı: ${menu.categories.length} kategori, ${products.length} ürün`);

  // canlı site kopyası projede duruyorsa menüyü doğrudan içine senkronla
  const SITE_MENU = join(root, 'www', 'menu');
  if (process.env.SKIP_SITE_SYNC !== '1' && existsSync(join(root, 'www'))) {
    rmSync(SITE_MENU, { recursive: true, force: true }); // eski hash'li asset'ler birikmesin
    copyDir(OUT_DIR, SITE_MENU);
    console.log(`www/menu güncellendi — FTP ile 'menu' klasörünü yüklemen yeterli.`);
  } else {
    console.log(`Çıktı klasörü: ${OUT_DIR}`);
  }
} finally {
  cleanup();
}
