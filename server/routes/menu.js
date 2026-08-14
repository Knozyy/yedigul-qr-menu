import { Router } from 'express';
import { getSetting, countMenuView, countProductView, canSubmitFeedback, insertFeedback } from '../db.js';

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const FEEDBACK_LANGS = new Set(['tr', 'en', 'ar', 'ru']);
const FEEDBACK_MAX_LEN = 1000;

// AR/RU boşsa EN'e, o da boşsa TR'ye düşer. Eski kayıtlarda EN boş
// olabildiğinden TR ve EN de birbirini yedekler.
export const fallbackText = (value, en, tr) => cleanText(value) || cleanText(en) || cleanText(tr);
const fallbackList = (value, en, tr) => (value?.length ? value : (en?.length ? en : tr));

function parseArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseList(value) {
  return parseArray(value).map(String).map((item) => item.trim()).filter(Boolean);
}

function i18nText(row, base) {
  const rawTr = cleanText(row[`${base}_tr`]);
  const rawEn = cleanText(row[`${base}_en`]);
  const tr = rawTr || rawEn;
  const en = rawEn || tr;
  return {
    tr,
    en,
    ar: fallbackText(row[`${base}_ar`], en, tr),
    ru: fallbackText(row[`${base}_ru`], en, tr),
  };
}

function i18nList(row, base) {
  const rawTr = parseList(row[`${base}_tr`]);
  const rawEn = parseList(row[`${base}_en`]);
  const tr = fallbackList(rawTr, rawEn, []);
  const en = fallbackList(rawEn, tr, []);
  const ar = parseList(row[`${base}_ar`]);
  const ru = parseList(row[`${base}_ru`]);
  return { tr, en, ar: fallbackList(ar, en, tr), ru: fallbackList(ru, en, tr) };
}

export function rowToPublicCategory(row) {
  // kind: 'sets' kategorisi ürün değil fix menüleri gösterir. İstemci bölümü
  // buna göre çizer; sırası normal kategorilerle birlikte sort'tan gelir.
  return { id: row.id, kind: row.kind || 'products', ...i18nText(row, 'name') };
}

export function rowToPublicItem(row) {
  const variants = parseArray(row.variants);
  const names = i18nText(row, 'name');
  return {
    id: row.id,
    cat: row.category_id,
    thumb: (names.en || names.tr || row.id).toUpperCase(),
    // Piyasa ürününe günlük fiyat girildiyse onu göster; girilmediyse "Piyasa Fiyatı" (null).
    price: row.is_market_price && row.price == null ? null : row.price,
    kcal: row.kcal ?? null,
    portion: row.portion ?? null,
    image_url: row.image_url,
    images: parseList(row.images),
    variants: variants.map((v) => ({
      name: {
        ...i18nText(v, 'name'),
      },
      price: v.price,
    })),
    diet: parseList(row.diet),
    popular: !!row.popular,
    chef: !!row.chef,
    name: names,
    desc: i18nText(row, 'desc'),
    ing: i18nList(row, 'ing'),
    alg: i18nList(row, 'alg'),
  };
}

// Menü sayfasının duyuru + restoran bilgisi bloğu (settings'ten)
export function publicMeta(db) {
  return {
    announcement: (() => {
      const rawTr = getSetting(db, 'announcement_tr', '') || '';
      const rawEn = getSetting(db, 'announcement_en', '') || '';
      const tr = cleanText(rawTr) || cleanText(rawEn);
      const en = cleanText(rawEn) || tr;
      return {
        tr, en,
        ar: fallbackText(getSetting(db, 'announcement_ar', '') || '', en, tr),
        ru: fallbackText(getSetting(db, 'announcement_ru', '') || '', en, tr),
      };
    })(),
    info: {
      phone: getSetting(db, 'info_phone', '') || '',
      hours: getSetting(db, 'info_hours', '') || '',
      wifi: getSetting(db, 'info_wifi', '') || '',
      instagram: getSetting(db, 'info_instagram', '') || '',
      google_review_url: getSetting(db, 'info_google_review_url', '') || '',
    },
    price_updated_at: getSetting(db, 'price_updated_at', '') || '',
  };
}

export function readPublicMenu(db) {
  const categories = db
    .prepare('SELECT id, kind, name_tr, name_en, name_ar, name_ru FROM categories WHERE is_active = 1 ORDER BY sort')
    .all()
    .map(rowToPublicCategory);
  const rows = db
    .prepare(
      `SELECT p.* FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_available = 1 AND p.is_hidden = 0 AND c.is_active = 1
       ORDER BY p.sort`
    )
    .all();
  return {
    categories,
    products: rows.map(rowToPublicItem),
    sets: readPublicSets(db),
    meta: publicMeta(db),
  };
}

/**
 * Müşteriye açık fix menüler.
 *
 * Yalnız kind='fix_menu' ve aktif olanlar. İçerik METİN olarak yazılır, ürün
 * kartına bağlanmaz: fix menü sabit bir paket, içindeki ürün tükendi/gizli
 * olsa bile paketin kendisi satılmaya devam eder.
 */
export function readPublicSets(db) {
  const sets = db
    .prepare(
      `SELECT * FROM product_sets
       WHERE kind = 'fix_menu' AND is_active = 1 ORDER BY sort`
    )
    .all();
  if (!sets.length) return [];

  const items = db
    .prepare(
      `SELECT i.set_id, i.qty,
              p.name_tr, p.name_en, p.name_ar, p.name_ru
       FROM product_set_items i
       JOIN products p ON p.id = i.product_id
       ORDER BY i.sort`
    )
    .all();

  const dil = (row, alan) => ({
    tr: fallbackText(row[`${alan}_tr`], row[`${alan}_en`], row[`${alan}_tr`]),
    en: fallbackText(row[`${alan}_en`], row[`${alan}_tr`], row[`${alan}_tr`]),
    ar: fallbackText(row[`${alan}_ar`], row[`${alan}_en`], row[`${alan}_tr`]),
    ru: fallbackText(row[`${alan}_ru`], row[`${alan}_en`], row[`${alan}_tr`]),
  });

  return sets.map((set) => ({
    id: set.id,
    name: dil(set, 'name'),
    desc: dil(set, 'desc'),
    price: set.price,
    items: items
      .filter((item) => item.set_id === set.id)
      .map((item) => ({ qty: item.qty, name: dil(item, 'name') })),
  }));
}

export function createMenuRouter(db) {
  const router = Router();

  // Görüntülenme sayımı BURADA yapılmaz: bu uç nokta 30 sn'de bir yoklanır
  // (polling) ve her yenilemede çağrılır. Sayım ayrı /view uç noktasında,
  // cihaz başına 6 saatlik tekrarsızlıkla yapılır.
  router.post('/view', (req, res) => {
    const id = typeof req.body?.id === 'string' ? req.body.id.trim().slice(0, 64) : '';
    if (!id) return res.status(400).json({ counted: false });
    res.json({ counted: countMenuView(db, id) });
  });

  // Ürün detayının açılması. Menü açılışından ayrı bir olay: hangi ürünlerin
  // merak edildiğini ölçer. Aynı cihaz farklı ürünlere bakınca hepsi sayılır.
  router.post('/product-view', (req, res) => {
    const id = typeof req.body?.id === 'string' ? req.body.id.trim().slice(0, 64) : '';
    const product = typeof req.body?.product === 'string' ? req.body.product.trim().slice(0, 64) : '';
    if (!id || !product) return res.status(400).json({ counted: false });
    res.json({ counted: countProductView(db, id, product) });
  });

  // Site içinde kalan geri bildirim. Yalnız 1-3 yıldız: 4-5 yıldız istemcide
  // doğrudan Google Maps'e gider ve buraya hiç uğramaz. Aksi bir istek gelirse
  // 400'dür — tablonun "düşük puan" anlamı böyle korunur.
  router.post('/feedback', (req, res) => {
    const b = req.body ?? {};

    const deviceId = typeof b.id === 'string' ? b.id.trim().slice(0, 64) : '';
    if (!deviceId) return res.status(400).json({ ok: false, error: 'device' });

    if (!Number.isInteger(b.rating) || b.rating < 1 || b.rating > 3) {
      return res.status(400).json({ ok: false, error: 'rating' });
    }

    const message = typeof b.message === 'string' ? b.message.trim() : '';
    if (!message || message.length > FEEDBACK_MAX_LEN) {
      return res.status(400).json({ ok: false, error: 'message' });
    }

    // Dil yalnızca panelde okumayı kolaylaştırır; tanınmayan değer hata değil,
    // varsayılana düşer. Misafirin yazdığı metin bir dil kodu yüzünden kaybolmaz.
    const lang = FEEDBACK_LANGS.has(b.lang) ? b.lang : 'tr';

    if (!canSubmitFeedback(db, deviceId)) {
      return res.status(429).json({ ok: false, error: 'limit' });
    }

    insertFeedback(db, { rating: b.rating, message, lang, deviceId });
    res.json({ ok: true });
  });

  router.get('/', (req, res) => {
    res.json(readPublicMenu(db));
  });
  return router;
}
