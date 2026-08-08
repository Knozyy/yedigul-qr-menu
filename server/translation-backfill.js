import { readFileSync } from 'node:fs';

const CATALOG_URL = new URL('./menu-translations.json', import.meta.url);

export const MENU_TRANSLATIONS = Object.freeze(
  JSON.parse(readFileSync(CATALOG_URL, 'utf8'))
);

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

function parseArray(value) {
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function translatedList(sourceValue, targetValue, language) {
  const source = parseArray(sourceValue).map(String).map(clean).filter(Boolean);
  const target = parseArray(targetValue).map(String).map(clean).filter(Boolean);

  // Kısmen veya tamamen elle girilmiş bir listeye dokunma. Sıra bilgisi olmayan
  // serbest metin listelerinde otomatik birleştirme yanlış eşleşme yaratabilir.
  if (!source.length || target.length) return null;

  const translated = source.map((term) => clean(MENU_TRANSLATIONS.terms[term]?.[language]));
  if (translated.some((term) => !term)) return null;
  return JSON.stringify(translated);
}

function translatedVariants(value) {
  const variants = parseArray(value);
  let changed = false;
  const next = variants.map((variant) => {
    if (!variant || typeof variant !== 'object' || Array.isArray(variant)) return variant;
    const source = clean(variant.name_en) || clean(variant.name_tr);
    const translation = MENU_TRANSLATIONS.variants[source];
    if (!source || !translation) return variant;

    const copy = { ...variant };
    if (!clean(copy.name_ru) && clean(translation.ru)) {
      copy.name_ru = translation.ru;
      changed = true;
    }
    if (!clean(copy.name_ar) && clean(translation.ar)) {
      copy.name_ar = translation.ar;
      changed = true;
    }
    return copy;
  });
  return changed ? JSON.stringify(next) : null;
}

/**
 * Mevcut Yedigül menüsündeki boş RU/AR alanlarını doldurur.
 *
 * - Yalnızca katalogdaki ürün/kategori kimliklerini ele alır.
 * - İngilizce kaynak metin katalogla aynıysa çeviriyi uygular; değişmiş bir
 *   metne eski çeviri yazmaz.
 * - Elle girilmiş, boş olmayan hiçbir alanı değiştirmez.
 * - Tekrar çalıştırılabilir; ikinci çalıştırmada değişiklik yapmaz.
 */
export function backfillMenuTranslations(db) {
  const stats = { categories: 0, products: 0, lists: 0, variants: 0 };
  if (!db.prepare('SELECT 1 FROM categories LIMIT 1').get()) return stats;

  const updateCategory = db.prepare(`
    UPDATE categories SET
      name_ru = CASE
        WHEN trim(coalesce(name_ru, '')) = '' AND name_en = @name_en THEN @name_ru
        ELSE name_ru
      END,
      name_ar = CASE
        WHEN trim(coalesce(name_ar, '')) = '' AND name_en = @name_en THEN @name_ar
        ELSE name_ar
      END
    WHERE id = @id AND (
      (trim(coalesce(name_ru, '')) = '' AND name_en = @name_en) OR
      (trim(coalesce(name_ar, '')) = '' AND name_en = @name_en)
    )
  `);

  const updateProduct = db.prepare(`
    UPDATE products SET
      name_ru = CASE
        WHEN trim(coalesce(name_ru, '')) = '' AND name_en = @name_en THEN @name_ru
        ELSE name_ru
      END,
      name_ar = CASE
        WHEN trim(coalesce(name_ar, '')) = '' AND name_en = @name_en THEN @name_ar
        ELSE name_ar
      END,
      desc_ru = CASE
        WHEN trim(coalesce(desc_ru, '')) = '' AND desc_en = @desc_en THEN @desc_ru
        ELSE desc_ru
      END,
      desc_ar = CASE
        WHEN trim(coalesce(desc_ar, '')) = '' AND desc_en = @desc_en THEN @desc_ar
        ELSE desc_ar
      END
    WHERE id = @id AND (
      (trim(coalesce(name_ru, '')) = '' AND name_en = @name_en) OR
      (trim(coalesce(name_ar, '')) = '' AND name_en = @name_en) OR
      (trim(coalesce(desc_ru, '')) = '' AND desc_en = @desc_en) OR
      (trim(coalesce(desc_ar, '')) = '' AND desc_en = @desc_en)
    )
  `);

  const selectLists = db.prepare(`
    SELECT id, ing_en, ing_ru, ing_ar, alg_en, alg_ru, alg_ar, variants
    FROM products
  `);
  const updateLists = db.prepare(`
    UPDATE products SET
      ing_ru = coalesce(@ing_ru, ing_ru),
      ing_ar = coalesce(@ing_ar, ing_ar),
      alg_ru = coalesce(@alg_ru, alg_ru),
      alg_ar = coalesce(@alg_ar, alg_ar),
      variants = coalesce(@variants, variants)
    WHERE id = @id
  `);

  const run = db.transaction(() => {
    for (const category of MENU_TRANSLATIONS.categories) {
      stats.categories += updateCategory.run(category).changes;
    }
    for (const product of MENU_TRANSLATIONS.products) {
      stats.products += updateProduct.run(product).changes;
    }
    for (const row of selectLists.all()) {
      const values = {
        id: row.id,
        ing_ru: translatedList(row.ing_en, row.ing_ru, 'ru'),
        ing_ar: translatedList(row.ing_en, row.ing_ar, 'ar'),
        alg_ru: translatedList(row.alg_en, row.alg_ru, 'ru'),
        alg_ar: translatedList(row.alg_en, row.alg_ar, 'ar'),
        variants: translatedVariants(row.variants),
      };
      const listChanges = [values.ing_ru, values.ing_ar, values.alg_ru, values.alg_ar]
        .filter((value) => value !== null).length;
      if (!listChanges && values.variants === null) continue;
      updateLists.run(values);
      stats.lists += listChanges;
      if (values.variants !== null) stats.variants += 1;
    }
  });

  run();
  return stats;
}
