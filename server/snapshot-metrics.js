/**
 * Ölçüt kaydı — anlık görüntü deposunun tek doğruluk kaynağı.
 *
 * Sabit bir liste yerine kural taşıyan bir kayıt kullanılır çünkü ürün fiyatı
 * VARLIK BAŞINA bir seridir: 100 ürün 100 ayrı seri demektir, tek tek
 * sayılamaz. Bunun yerine ölçüt "entity ister mi" diye tanımlanır.
 *
 * Panel ayrı bir depo olduğu için bu kaydı paylaşamaz; doğrulamanın otoritesi
 * burasıdır. Panel yalnızca gönderir, reddedileni yanıttan öğrenir.
 */
export const METRIC_REGISTRY = {
  'ig.followers': { entity: 'yok' },
  'ig.reach': { entity: 'yok' },
  'reviews.rating': { entity: 'yok' },
  'reviews.count': { entity: 'yok' },
  // Ürün başına günlük fiyat. entity = ürün id'si, varyantlıda "<id>-<sıra>".
  'menu.price': { entity: 'zorunlu' },
  // Fix menü / masa senaryosu satış fiyatı. Yeri ayrıldı; henüz kimse yazmıyor.
  'menu.setPrice': { entity: 'zorunlu' },
};

// Ürün id'si sunucuda ^[A-Za-z0-9_-]{1,64}$ ile sınırlı; varyant eki ile
// birlikte 80 karakter fazlasıyla yeter.
const ENTITY_RE = /^[A-Za-z0-9_.-]{1,80}$/;

export function isKnownMetric(metric) {
  return Object.hasOwn(METRIC_REGISTRY, metric);
}

export function isValidEntity(metric, entity) {
  const rule = METRIC_REGISTRY[metric];
  if (!rule) return false;
  if (rule.entity === 'yok') return entity === '';
  return ENTITY_RE.test(entity);
}
