import { Router } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getSetting } from './db.js';
import { readPublicMenu } from './routes/menu.js';

export const SITE_URL = 'https://www.yedigulrestorant.com';

// Sitemap'teki statik sayfalar. lastmod, sayfa içeriği değiştiğinde elle
// güncellenir; menü ve fiyat sayfası ise son fiyat değişikliğinden gelir.
const PAGES = [
  { path: '/', lastmod: '2026-11-22', priority: '1.0' },
  { path: '/menu/', lastmod: 'prices', priority: '0.9' },
  { path: '/fiyatlar/', lastmod: 'prices', priority: '0.8' },
  { path: '/hakkimizda/', lastmod: '2026-11-22', priority: '0.6' },
  { path: '/iletisim/', lastmod: '2026-11-22', priority: '0.6' },
  { path: '/anadolukavagi-nerede-yemek-yenir/', lastmod: '2026-07-12', priority: '0.6' },
  { path: '/nasil-gelinir/', lastmod: '2026-07-12', priority: '0.6' },
  { path: '/bogazda-balik-raki/', lastmod: '2026-07-12', priority: '0.6' },
  { path: '/gizlilik/', lastmod: '2026-11-22', priority: '0.3' },
  { path: '/kullanim-kosullari/', lastmod: '2026-11-22', priority: '0.3' },
];

const HOME_LINK_HEADER = [
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</index.md>; rel="alternate"; type="text/markdown"',
  '</fiyatlar/>; rel="related"; title="Menu and prices"',
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
].join(', ');

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const escapeMd = (value) => String(value ?? '').replace(/([\\`*_[\]|])/g, '\\$1');

// <script type="application/ld+json"> içinde "</script>" metni bloğu kapatmasın.
const jsonLd = (data) => JSON.stringify(data, null, 2).replace(/</g, '\\u003c');

export const formatPrice = (price) => `${Number(price).toLocaleString('tr-TR')} ₺`;

export function wantsMarkdown(req) {
  return req.accepts(['text/html', 'text/markdown']) === 'text/markdown';
}

function priceDate(db) {
  const raw = getSetting(db, 'price_updated_at', '') || '';
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : '';
}

export function buildPriceModel(db) {
  const menu = readPublicMenu(db);
  const sections = menu.categories
    .filter((cat) => cat.kind !== 'sets')
    .map((cat) => ({
      id: cat.id,
      name: cat.tr,
      nameEn: cat.en,
      items: menu.products
        .filter((p) => p.cat === cat.id)
        .map((p) => ({
          id: p.id,
          name: p.name.tr,
          nameEn: p.name.en,
          desc: p.desc.tr,
          portion: p.portion,
          price: p.price,
          variants: (p.variants || [])
            .filter((v) => v.price != null)
            .map((v) => ({ name: v.name.tr, price: v.price })),
        })),
    }))
    .filter((section) => section.items.length);
  const sets = menu.sets.map((set) => ({
    id: set.id,
    name: set.name.tr,
    price: set.price,
    items: set.items.map((item) => `${item.qty > 1 ? `${item.qty} × ` : ''}${item.name.tr}`),
  }));
  return { sections, sets, updated: priceDate(db) };
}

function offersFor(item) {
  const priced = [{ name: item.name, price: item.price }, ...item.variants.map((v) => ({ name: `${item.name} (${v.name})`, price: v.price }))]
    .filter((o) => typeof o.price === 'number');
  return priced.map((o) => ({
    '@type': 'Offer',
    name: o.name,
    price: o.price,
    priceCurrency: 'TRY',
    availability: 'https://schema.org/InStock',
  }));
}

function menuSchema(model) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${SITE_URL}/fiyatlar/#menu`,
    name: 'Yedigül Restaurant Menü ve Fiyat Listesi',
    url: `${SITE_URL}/fiyatlar/`,
    inLanguage: 'tr-TR',
    ...(model.updated ? { dateModified: model.updated } : {}),
    provider: { '@type': 'Restaurant', '@id': `${SITE_URL}/#restaurant`, name: 'Yedigül Restaurant' },
    hasMenuSection: [
      ...model.sections.map((section) => ({
        '@type': 'MenuSection',
        name: section.name,
        hasMenuItem: section.items.map((item) => {
          const offers = offersFor(item);
          return {
            '@type': 'MenuItem',
            name: item.name,
            ...(item.desc ? { description: item.desc } : {}),
            ...(offers.length ? { offers } : {}),
          };
        }),
      })),
      ...(model.sets.length
        ? [{
            '@type': 'MenuSection',
            name: 'Fix Menüler',
            hasMenuItem: model.sets.map((set) => ({
              '@type': 'MenuItem',
              name: set.name,
              description: set.items.join(', '),
              ...(typeof set.price === 'number'
                ? { offers: [{ '@type': 'Offer', price: set.price, priceCurrency: 'TRY', availability: 'https://schema.org/InStock' }] }
                : {}),
            })),
          }]
        : []),
    ],
  };
}

const priceLabel = (price) => (typeof price === 'number' ? formatPrice(price) : 'Piyasa fiyatı');

function sectionHtml(section) {
  const rows = section.items
    .map((item) => {
      const variants = item.variants.length
        ? `<ul class="price-list__variants">${item.variants.map((v) => `<li>${escapeHtml(v.name)} <span>${escapeHtml(formatPrice(v.price))}</span></li>`).join('')}</ul>`
        : '';
      const meta = [item.portion, item.desc].filter(Boolean).map(escapeHtml).join(' · ');
      return `
            <li class="price-list__item">
              <div class="price-list__row"><strong>${escapeHtml(item.name)}</strong><span class="price-list__price">${escapeHtml(priceLabel(item.price))}</span></div>
              ${item.nameEn && item.nameEn !== item.name ? `<span class="price-list__en" lang="en">${escapeHtml(item.nameEn)}</span>` : ''}
              ${meta ? `<p>${meta}</p>` : ''}${variants}
            </li>`;
    })
    .join('');
  return `
          <h2 id="${escapeHtml(section.id)}">${escapeHtml(section.name)}</h2>
          <ul class="price-list">${rows}
          </ul>`;
}

function setsHtml(sets) {
  if (!sets.length) return '';
  const rows = sets
    .map((set) => `
            <li class="price-list__item">
              <div class="price-list__row"><strong>${escapeHtml(set.name)}</strong><span class="price-list__price">${escapeHtml(priceLabel(set.price))}</span></div>
              <p>${set.items.map(escapeHtml).join(', ')}</p>
            </li>`)
    .join('');
  return `
          <h2 id="fix-menuler">Fix Menüler</h2>
          <ul class="price-list">${rows}
          </ul>`;
}

export function renderPricesHtml(model) {
  const updatedText = model.updated
    ? `Fiyatlar en son <time datetime="${model.updated}">${new Date(`${model.updated}T00:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time> tarihinde güncellendi.`
    : 'Fiyatlar dijital menümüzle aynı kaynaktan gelir.';
  const toc = [...model.sections.map((s) => `<a href="#${escapeHtml(s.id)}">${escapeHtml(s.name)}</a>`), ...(model.sets.length ? ['<a href="#fix-menuler">Fix Menüler</a>'] : [])].join('\n            ');
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Menü ve Fiyatlar', item: `${SITE_URL}/fiyatlar/` },
    ],
  };
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Menü ve Fiyat Listesi | Yedigül Restaurant Anadolukavağı</title>
  <meta name="description" content="Yedigül Restaurant güncel menü ve fiyat listesi: balık, mezeler, ara sıcaklar, salatalar, tatlılar ve içecekler. Fiyatlar Türk lirası (₺).">
  <link rel="canonical" href="${SITE_URL}/fiyatlar/">
  <link rel="alternate" type="text/markdown" href="/fiyatlar.md">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="Yedigül Restaurant">
  <meta property="og:url" content="${SITE_URL}/fiyatlar/">
  <meta property="og:title" content="Menü ve Fiyat Listesi | Yedigül Restaurant">
  <meta property="og:image" content="${SITE_URL}/images/slider/2.jpg">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="icon" type="image/png" href="/images/logo/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Jost:wght@300;400;500;600&display=swap&subset=latin,latin-ext" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>
  <header class="page-nav">
    <div class="page-nav__inner">
      <a class="page-nav__brand" href="/" aria-label="Yedigül Restaurant ana sayfa">
        <img src="/images/logo/logo.png" alt="Yedigül Restaurant logosu">
        <span>Yedigül<small>Anadolukavağı</small></span>
      </a>
      <nav class="page-nav__links" aria-label="Sayfalar">
        <a href="/">Ana Sayfa</a>
        <a href="/menu/">Dijital Menü</a>
        <a href="/fiyatlar/" aria-current="page">Fiyatlar</a>
        <a href="/hakkimizda/">Hakkımızda</a>
        <a href="/iletisim/">İletişim</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="page-hero">
      <div class="page-hero__bg"><img src="/images/slider/2.jpg" alt="" aria-hidden="true"></div>
      <div class="wrap">
        <p class="eyebrow">Menü ve Fiyatlar</p>
        <h1>Yedigül <em>fiyat listesi</em></h1>
        <p>${updatedText} Balık fiyatları mevsime ve günün avına göre değişebilir; "piyasa fiyatı" yazan ürünler için lütfen servis ekibimize danışın.</p>
      </div>
    </section>

    <section class="page-body">
      <div class="wrap">
        <article class="prose price-page">
          <nav class="price-page__toc" aria-label="Kategoriler">
            ${toc}
          </nav>${model.sections.map(sectionHtml).join('')}${setsHtml(model.sets)}
          <p class="not">Fiyatlara KDV dahildir. Fotoğraflı ve 4 dilli (TR · EN · AR · RU) menü için <a href="/menu/">dijital menümüze</a> bakabilirsiniz.</p>
        </article>
      </div>
    </section>

    <footer class="page-foot">
      <div class="wrap">
        <nav aria-label="Alt bağlantılar">
          <a href="/">Ana Sayfa</a>
          <a href="/menu/">Dijital Menü</a>
          <a href="/hakkimizda/">Hakkımızda</a>
          <a href="/iletisim/">İletişim</a>
          <a href="/gizlilik/">Gizlilik</a>
          <a href="/kullanim-kosullari/">Kullanım Koşulları</a>
        </nav>
        <p>Yedigül Restaurant · Anadolu Kavağı Mah. Macar Tabya Cd. 6/A, Beykoz / İstanbul · <a href="tel:+905369379280">+90 536 937 92 80</a></p>
      </div>
    </footer>
  </main>

  <script type="application/ld+json">
${jsonLd(menuSchema(model))}
  </script>
  <script type="application/ld+json">
${jsonLd(breadcrumb)}
  </script>
  <script src="/js/site.js" defer></script>
</body>
</html>
`;
}

export function renderPricesMarkdown(model) {
  const lines = [
    '# Yedigül Restaurant — Menü ve Fiyat Listesi',
    '',
    '> Anadolu Kavağı (Beykoz, İstanbul) Boğaz kıyısında balık restoranı. Fiyatlar Türk lirası (₺), KDV dahil.',
    '',
    model.updated ? `Son fiyat güncellemesi: ${model.updated}` : '',
    'HTML sürümü: https://www.yedigulrestorant.com/fiyatlar/',
    '',
  ].filter((line, i, all) => line !== '' || all[i - 1] !== '');
  for (const section of model.sections) {
    lines.push(`## ${escapeMd(section.name)}`, '');
    for (const item of section.items) {
      const extra = item.portion ? ` (${escapeMd(item.portion)})` : '';
      lines.push(`- ${escapeMd(item.name)}${extra}: ${priceLabel(item.price)}`);
      for (const v of item.variants) lines.push(`  - ${escapeMd(v.name)}: ${formatPrice(v.price)}`);
    }
    lines.push('');
  }
  if (model.sets.length) {
    lines.push('## Fix Menüler', '');
    for (const set of model.sets) lines.push(`- ${escapeMd(set.name)}: ${priceLabel(set.price)} — ${set.items.map(escapeMd).join(', ')}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function renderSitemap(db) {
  const prices = priceDate(db);
  const urls = PAGES.map((page) => {
    const lastmod = page.lastmod === 'prices' ? prices : page.lastmod;
    return [
      '  <url>',
      `    <loc>${SITE_URL}${page.path}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
      `    <priority>${page.priority}</priority>`,
      '  </url>',
    ].filter(Boolean).join('\n');
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function createSiteRouter({ db, siteDir }) {
  const router = Router();
  const homeMd = join(siteDir, 'index.md');

  router.get('/', (req, res, next) => {
    res.setHeader('Link', HOME_LINK_HEADER);
    res.vary('Accept');
    if (wantsMarkdown(req) && existsSync(homeMd)) {
      res.type('text/markdown; charset=utf-8');
      return res.sendFile(homeMd);
    }
    next();
  });

  router.get('/index.md', (req, res, next) => {
    if (!existsSync(homeMd)) return next();
    res.type('text/markdown; charset=utf-8');
    res.sendFile(homeMd);
  });

  const sendPricesMarkdown = (res) => {
    res.type('text/markdown; charset=utf-8');
    res.send(renderPricesMarkdown(buildPriceModel(db)));
  };

  router.get('/fiyatlar.md', (_req, res) => sendPricesMarkdown(res));

  router.get('/fiyatlar', (req, res) => {
    if (!req.path.endsWith('/')) return res.redirect(301, '/fiyatlar/');
    res.setHeader('Link', '</fiyatlar.md>; rel="alternate"; type="text/markdown"');
    res.vary('Accept');
    if (wantsMarkdown(req)) return sendPricesMarkdown(res);
    res.type('html').send(renderPricesHtml(buildPriceModel(db)));
  });

  router.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml; charset=utf-8').send(renderSitemap(db));
  });

  return router;
}

export function createNotFoundHandler({ siteDir }) {
  const page = join(siteDir, '404.html');
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.status(404);
    if (req.accepts(['text/html', 'text/plain', 'application/json']) === 'text/html' && existsSync(page)) {
      return res.sendFile(page);
    }
    res.type('text/plain; charset=utf-8').send('404 — Sayfa bulunamadı. https://www.yedigulrestorant.com/');
  };
}
