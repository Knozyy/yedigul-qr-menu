import { api } from './api';
import { getDeviceId } from './deviceId';

// Statik dışa aktarımda (VITE_STATIC=1) arka uç yoktur; menü verisi pakete
// gömülüdür. Sayım çağrısı orada anlamsız — MenuContext'teki açılış ping'i de
// aynı koşulla susuyor.
const IS_STATIC = import.meta.env.VITE_STATIC === '1';

/**
 * Ürün detayının açıldığını bildirir.
 *
 * Ateşle-unut: hata yutulur. Sayaç düşerse misafirin menüsü etkilenmemeli —
 * bu çağrı menünün çalışması için gerekli değil, yalnızca ilgi ölçüyor.
 * 6 saatlik tekrarsızlığı sunucu uygular (bkz. countProductView).
 */
export function trackProductView(productId) {
  if (IS_STATIC || !productId) return;
  api.post('/menu/product-view', { id: getDeviceId(), product: productId }).catch(() => {});
}
