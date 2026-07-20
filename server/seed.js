import { CATEGORIES, ITEMS } from './seed-data.js';
import { backfillMenuTranslations } from './translation-backfill.js';

export function seed(db) {
  const existing = db.prepare('SELECT COUNT(*) n FROM categories').get().n;
  if (existing > 0) return;

  const insertCat = db.prepare(
    `INSERT INTO categories (id, name_tr, name_en, sort, is_active)
     VALUES (@id, @name_tr, @name_en, @sort, 1)`
  );
  const insertProd = db.prepare(
    `INSERT INTO products
      (id, category_id, name_tr, name_en, desc_tr, desc_en, price, is_market_price,
       image_url, is_available, popular, chef, diet, ing_tr, ing_en, alg_tr, alg_en, sort, kcal, portion)
     VALUES
      (@id, @category_id, @name_tr, @name_en, @desc_tr, @desc_en, @price, @is_market_price,
       NULL, 1, @popular, @chef, @diet, @ing_tr, @ing_en, @alg_tr, @alg_en, @sort, @kcal, @portion)`
  );

  const tx = db.transaction(() => {
    CATEGORIES.forEach((c, i) => {
      insertCat.run({ id: c.id, name_tr: c.tr, name_en: c.en, sort: i });
    });
    ITEMS.forEach((it, i) => {
      insertProd.run({
        id: it.id,
        category_id: it.cat,
        name_tr: it.name.tr,
        name_en: it.name.en,
        desc_tr: it.desc?.tr ?? '',
        desc_en: it.desc?.en ?? '',
        price: it.price ?? null,
        is_market_price: it.price == null ? 1 : 0,
        popular: it.popular ? 1 : 0,
        chef: it.chef ? 1 : 0,
        diet: JSON.stringify(it.diet ?? []),
        ing_tr: JSON.stringify(it.ing?.tr ?? []),
        ing_en: JSON.stringify(it.ing?.en ?? []),
        alg_tr: JSON.stringify(it.alg?.tr ?? []),
        alg_en: JSON.stringify(it.alg?.en ?? []),
        sort: i,
        kcal: it.kcal ?? null,
        portion: it.portion ?? null,
      });
    });
  });
  tx();
  backfillMenuTranslations(db);
}
