/**
 * Fix menü içerik listesi işlemleri.
 *
 * Saf tutulur: seçici arayüzü tıklama olaylarına bağlı, doğrudan test edilmesi
 * zor. "Adet sıfıra düşünce kalem çıkar" ve "var olan ürüne tekrar tıklayınca
 * artar" gibi davranışlar burada tek başına sınanır.
 *
 * Ürün listede BİR KEZ bulunur (sunucudaki PK ile aynı kural); ikinci kez
 * eklemek yeni satır değil, adet artışıdır.
 */

export function urunEkle(items, productId) {
  if (!productId) return items;
  if (items.some((row) => row.product_id === productId)) {
    return items.map((row) => (row.product_id === productId ? { ...row, qty: row.qty + 1 } : row));
  }
  return [...items, { product_id: productId, qty: 1 }];
}

/** Adet değiştirir; sıfıra veya altına inen kalem listeden düşer. */
export function adetDegistir(items, productId, delta) {
  return items
    .map((row) => (row.product_id === productId ? { ...row, qty: row.qty + delta } : row))
    .filter((row) => row.qty > 0);
}

export function urunCikar(items, productId) {
  return items.filter((row) => row.product_id !== productId);
}

/** Setin bileşenlerinin ham toplamı — tek fiyatı yoksa varyantın ilki alınır. */
export function hamToplam(items, productsById) {
  let toplam = 0;
  for (const row of items) {
    const product = productsById[row.product_id];
    if (!product) continue;
    const price = product.price ?? product.variants?.[0]?.price ?? null;
    if (price != null) toplam += Number(price) * Number(row.qty || 1);
  }
  return toplam;
}
