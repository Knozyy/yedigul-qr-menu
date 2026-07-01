// Statik menü dışa aktarımı: SQLite'taki menüyü dist-menu/ içine
// menu-data.json + uploads/ olarak yazar. `npm run export:menu` bunu
// vite build'den sonra çalıştırır; çıkan klasör public_html/menu/ olur.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, existsSync, readdirSync, copyFileSync, statSync, rmSync } from 'node:fs';

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
import { rowToPublicItem } from '../server/routes/menu.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const DB_PATH = process.env.DB_PATH || join(root, 'server', 'data.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || join(root, 'server', 'uploads');
const OUT_DIR = join(root, 'dist-menu');

const db = openDb(DB_PATH);
seed(db); // boş db ise menu.js'ten doldur

const categories = db
  .prepare('SELECT id, name_tr AS tr, name_en AS en FROM categories WHERE is_active = 1 ORDER BY sort')
  .all();
const rows = db
  .prepare(
    `SELECT p.* FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.is_available = 1 AND c.is_active = 1
     ORDER BY p.sort`
  )
  .all();

// /uploads/x.jpg -> uploads/x.jpg (paket içi göreli yol; /menu/ altında çözülür)
const products = rows.map(rowToPublicItem).map((p) => ({
  ...p,
  image_url: p.image_url ? p.image_url.replace(/^\//, '') : null,
}));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'menu-data.json'), JSON.stringify({ categories, products }));

if (existsSync(UPLOADS_DIR)) {
  copyDir(UPLOADS_DIR, join(OUT_DIR, 'uploads'));
}

console.log(`menu-data.json yazıldı: ${categories.length} kategori, ${products.length} ürün`);

// canlı site kopyası projede duruyorsa menüyü doğrudan içine senkronla
const SITE_MENU = join(root, 'public_html', 'menu');
if (existsSync(join(root, 'public_html'))) {
  rmSync(SITE_MENU, { recursive: true, force: true }); // eski hash'li asset'ler birikmesin
  copyDir(OUT_DIR, SITE_MENU);
  console.log(`public_html/menu güncellendi — FTP ile 'menu' klasörünü yüklemen yeterli.`);
} else {
  console.log(`Çıktı klasörü: ${OUT_DIR}`);
}
