export const LANGUAGES = Object.freeze([
  { code: 'tr', locale: 'tr-TR', dir: 'ltr', nativeName: 'Türkçe' },
  { code: 'en', locale: 'en-GB', dir: 'ltr', nativeName: 'English' },
  { code: 'ar', locale: 'ar', dir: 'rtl', nativeName: 'العربية' },
  { code: 'ru', locale: 'ru-RU', dir: 'ltr', nativeName: 'Русский' },
]);

export const LANGUAGE_CODES = Object.freeze(LANGUAGES.map(({ code }) => code));

export function getLanguage(code) {
  return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
}

function hasContent(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
}

// Seçili dil boşsa EN'e, o da boşsa TR'ye düşer. TR/EN alanları da eski
// verilerde boş olabileceği için birbirini yedekler.
export function localize(field, lang) {
  if (!field || typeof field !== 'object') return '';
  const order = [...new Set([lang, 'en', 'tr'])];
  for (const code of order) {
    if (hasContent(field[code])) return field[code];
  }
  return Array.isArray(field[lang]) ? [] : '';
}

export function foldForSearch(value, lang) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase(getLanguage(lang).locale)
    .replace(/ı/g, 'i');
}

export function formatItemCount(count, lang) {
  const n = Number(count) || 0;
  if (lang === 'tr') return `${n} çeşit`;
  if (lang === 'en') return `${n} ${n === 1 ? 'item' : 'items'}`;
  if (lang === 'ar') {
    if (n === 1) return 'صنف واحد';
    if (n === 2) return 'صنفان';
    if (n >= 3 && n <= 10) return `${n} أصناف`;
    return `${n} صنفًا`;
  }
  if (lang === 'ru') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    const word = mod10 === 1 && mod100 !== 11
      ? 'позиция'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'позиции'
        : 'позиций';
    return `${n} ${word}`;
  }
  return String(n);
}

export function formatNumber(value, lang) {
  return new Intl.NumberFormat(getLanguage(lang).locale, {
    maximumFractionDigits: 2,
  }).format(Number(value));
}
