// Görselsiz ürünler için kategoriye özel placeholder: balık pulu (scallop)
// dokusu üzerine altın çizgi ikon üreten SVG data-URI. Renkler tema
// CSS değişkeni olamaz (data-URI), o yüzden dark bayrağıyla üretilir.
const GLYPHS = {
  fish: ['M14 36 C22 26 38 23 48 31 C51 33 54 34.5 58 36 C54 37.5 51 39 48 41 C38 49 22 46 14 36 Z', 'M58 36 L66 28.5', 'M58 36 L66 43.5', 'M25 33.5 a1.4 1.4 0 1 0 0.05 0'],
  hot: ['M20 33 H52', 'M23 33 V41 C23 46 26.5 49 31.5 49 H40.5 C45.5 49 49 46 49 41 V33', 'M52 35.5 H58', 'M30 26 C30 23.5 32.5 23.5 32.5 21', 'M40 26 C40 23.5 42.5 23.5 42.5 21'],
  cold: ['M36 52 L23.5 30', 'M36 52 L30 26.5', 'M36 52 L36 25', 'M36 52 L42 26.5', 'M36 52 L48.5 30', 'M23.5 30 C30 22.5 42 22.5 48.5 30'],
  salad: ['M36 54 C23 46 23 28 36 18 C49 28 49 46 36 54 Z', 'M36 25 V49', 'M36 35 L29.5 30.5', 'M36 41 L42.5 36'],
  meat: ['M18 54 L54 18', 'M26 40 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0', 'M36 30 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'],
  dessert: ['M36 20 L52 36 L36 52 L20 36 Z', 'M28.5 28.5 L43.5 43.5', 'M43.5 28.5 L28.5 43.5'],
  drink: ['M28 20 C28 32 30 37.5 36 39.5 C42 37.5 44 32 44 20 Z', 'M29 51 H43', 'M36 39.5 V51'],
  search: ['M21 32 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0', 'M40 40 L51 51'],
  heart: ['M36 50 C25 41.5 20 34.5 20 27.5 C20 21.8 24.3 17.5 29.3 17.5 C32 17.5 34.6 19 36 21.3 C37.4 19 40 17.5 42.7 17.5 C47.7 17.5 52 21.8 52 27.5 C52 34.5 47 41.5 36 50 Z'],
};

// DB'de olup ikon setinde olmayan kategoriler en yakın ikona eşlenir.
const ALIAS = { beer: 'drink', wine: 'drink', raki: 'drink', spirits: 'drink', kahvalti: 'hot' };

const cache = new Map();

/**
 * @param {string} cat   kategori id'si (bilinmeyen id balık ikonuna düşer)
 * @param {'thumb'|'hero'|'empty'} mode
 * @param {boolean} dark
 * @returns {string} data-URI
 */
export function placeholderArt(cat, mode, dark) {
  const glyph = GLYPHS[cat] ? cat : ALIAS[cat] || 'fish';
  const key = `${glyph}|${mode}|${dark ? 1 : 0}`;
  if (cache.has(key)) return cache.get(key);

  const [w, h] = mode === 'hero' ? [300, 130] : mode === 'empty' ? [120, 120] : [72, 72];
  const bg = dark ? '#13304F' : '#F0E6CF';
  const line = dark ? 'rgba(226,180,92,0.20)' : 'rgba(16,41,66,0.15)';
  const ink = dark ? '#C8902F' : '#A6741F';

  let scales = '';
  const r = 9;
  for (let row = 0, y = 0; y <= h + r; y += r, row++) {
    const off = row % 2 ? -r : 0;
    for (let x = off; x <= w + r; x += r * 2) {
      scales += `M${x - r} ${y} a${r} ${r} 0 0 1 ${2 * r} 0 `;
    }
  }

  const sc = mode === 'thumb' ? 0.82 : 1.15;
  const tx = (w - 72 * sc) / 2;
  const ty = (h - 72 * sc) / 2;
  const g = GLYPHS[glyph].map((p) => `<path d="${p}"/>`).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${bg}"/>` +
    `<path d="${scales}" fill="none" stroke="${line}" stroke-width="1"/>` +
    `<g transform="translate(${tx} ${ty}) scale(${sc})" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${g}</g>` +
    `</svg>`;
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(key, uri);
  return uri;
}
