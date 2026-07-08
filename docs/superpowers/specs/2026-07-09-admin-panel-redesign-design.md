# Admin Paneli Yeniden Tasarımı — Tasarım Dokümanı

**Tarih:** 2026-07-09
**Kapsam:** Yönetim paneli (`/menu/admin`) arayüzü. Sadece frontend (`src/pages/admin/`, `src/components/admin/`). Backend API'si ve veri modeli DEĞİŞMEZ.

## Amaç

199 ürünle mevcut panel zor kullanılıyor. Kullanıcının bildirdiği 4 dert:
1. Ürün bulmak zor (arama/filtre yok, tek uzun liste).
2. Sıralama/düzen zahmetli (199 satırda tek adım ▲▼).
3. Görsel/estetik zayıf (buton kalabalığı, hiyerarşi yok, panel toggle karmaşası).
4. Ürün formu çok uzun tek sütun.

Hedef: **B — responsive dashboard kabuğu.** Mobilde tek sütun + alt sekme, geniş ekranda yan menü + ızgara.

## Mevcut durum (özet)

- `DashboardPage.jsx`: 640px tek sütun. Başlıkta 6 buton (Ana Sayfa, Kategoriler, Bilgiler, Geçmiş, QR, Çıkış). `showCategories/showInfo/showHistory/showQr` state'leriyle paneller ürün listesinin üstünde satır içi açılıp kapanıyor. Altında tüm ürünler kategoriye göre gruplu `ProductRow` listesi.
- API çağrıları `src/lib/api.js` üzerinden; `GET /admin/menu` kategoriler+ürünleri döndürüyor.
- Paylaşılan bileşenler: `ProductRow`, `ProductForm`, `ImageUploader`, `CategoryForm`, `InfoPanel`, `HistoryPanel`, `QrPanel`.
- Tema: `getThemeVars(true, '#C8902F')` → CSS değişkenleri (lacivert/altın/krem). Korunacak.

## Hedef UX

### Navigasyon modeli
Satır-içi toggle paneller yerine **görünüm (view) tabanlı** yönlendirme. `DashboardPage` içinde tek `view` state'i: `products | categories | info | history | qr`. (Yeni route gerekmez; state ile geçiş.) `editing` ürün formu, `products` görünümünün üstüne modal/tam-ekran katman olarak gelir.

### Responsive kabuk — yeni bileşen `AdminShell`
- **Ortak üst çubuk (`AdminTopBar`):** solda "Yedigül · Yönetim" + aktif görünüm başlığı; sağda birincil aksiyon (**＋ Ürün**, yalnız products görünümünde) ve **Çıkış**.
- **Masaüstü (≥768px):** solda sabit dikey **yan menü** (`AdminNav`, ikon+etiket): Ürünler, Kategoriler, Bilgiler, Geçmiş, QR. İçerik alanı geniş (max ~1100px), sayfa ortalı.
- **Mobil (<768px):** yan menü gizli; ekranın altında sabit **alt sekme çubuğu** (aynı 5 öğe, ikon+kısa etiket). İçerik tek sütun; alt çubuk için `padding-bottom`.
- Aynı `AdminNav` öğe listesi iki yerleşimi de besler (tek kaynak).

### Ürünler görünümü (`ProductsView`)
- **Sticky araç çubuğu:**
  - Arama kutusu (ad TR/EN'de canlı filtre, büyük/küçük ve TR harf duyarsız).
  - **Kategori çipleri:** "Tümü" + her kategori. Seçince yalnız o kategori listelenir.
  - **Durum filtresi:** Tümü / Aktif / Pasif.
  - Sağda sonuç sayacı ("X ürün").
- **Liste:** yeni `ProductCard` (aşağıda). Kategori filtresi "Tümü" iken kategoriye göre başlıklı gruplar; tek kategori seçiliyken düz liste + sıralama kolay.
- Boş durum: "Sonuç yok" mesajı.

### `ProductCard` (ProductRow yerine)
- Sol: kare thumbnail (yoksa desenli placeholder).
- Orta: ad (TR, kalın), altında kategori rozeti + fiyat/piyasa/"₺X–Y" (varyant aralığı). Popüler/Şef rozetleri.
- Sağ: **Aktif/Pasif** anahtarı (dokun→toggle, `PATCH is_available`), **Düzenle**.
- Sıralama: ▲▼ (ilk/son'da pasif) + **"En üste"** kısayolu. Sıralama yalnız tek-kategori görünümünde anlamlı; "Tümü"de gruplar arası taşımaya izin verilmez (kategori içi sıra korunur). Reorder mantığı mevcut `onMoveProduct` deseniyle (per-category index PATCH) aynı kalır.
- Dokunma hedefleri ≥40px; kartlar yumuşak köşeli, net boşluklu.

### Ürün formu (`ProductForm`) yeniden düzeni
Aynı alanlar, ama başlıklı **bölümlere** ayrılır; masaüstünde 2 sütun grid, mobilde tek sütun:
1. **Temel:** kategori, ad TR/EN, açıklama TR/EN.
2. **Fiyat & Porsiyon:** piyasa fiyatı anahtarı, fiyat (varyant yoksa), porsiyon miktar+birim, kcal.
3. **Varyantlar:** mevcut varyant editörü (fiyat aralığı notuyla).
4. **Görseller:** çoklu `ImageUploader` (mevcut, korunur).
5. **Çeviriler (AR/RU):** ad/açıklama/içindekiler/alerjenler — katlanabilir (varsayılan kapalı, doluysa açık).
6. **Etiketler:** glutensiz/vejetaryen, popüler, şef, stokta.
Aksiyonlar (**Kaydet / İptal / Sil**) altta sabit çubukta. Form, products görünümü üstünde tam-ekran katman.

### Diğer görünümler
- **Kategoriler / Bilgiler / Geçmiş / QR:** mevcut bileşenler (`CategoryForm`, `InfoPanel`, `HistoryPanel`, `QrPanel`) aynı işlevle; sadece yeni kabuğun içine "sayfa" olarak yerleştirilir. Gerekirse yeni tema/boşluk sınıfları; iç mantık değişmez. `QrPanel` lazy + statik-elde-etme davranışı korunur.

## Bileşen dökümü (yeni/değişen)

| Dosya | Durum | Sorumluluk |
|-------|-------|-----------|
| `src/components/admin/AdminShell.jsx` | yeni | Responsive kabuk: üst çubuk + yan menü/alt sekme + içerik slotu |
| `src/components/admin/AdminNav.jsx` | yeni | Görünüm listesi + ikonlar; hem sidebar hem bottom-bar render eder |
| `src/components/admin/ProductsView.jsx` | yeni | Arama+filtre+sayaç+liste; `DashboardPage`'ten ürün mantığı buraya taşınır |
| `src/components/admin/ProductCard.jsx` | yeni | `ProductRow` yerine kart |
| `src/pages/admin/DashboardPage.jsx` | değişir | Sadece durum orkestrasyonu: `view` + `editing` + veri yükleme; render `AdminShell`'e devredilir |
| `src/components/admin/ProductForm.jsx` | değişir | Bölümlü/2 sütun düzen; alanlar/aksiyonlar aynı |
| `ProductRow.jsx` | silinir | `ProductCard` devralır |
| `CategoryForm/InfoPanel/HistoryPanel/QrPanel/ImageUploader` | değişmez (gerekirse ufak stil) | Aynı işlev |

## Veri akışı
- `DashboardPage` `GET /admin/menu` ile kategori+ürün yükler (bugünkü gibi), `reload()` sağlar.
- `view` ve `editing` state'i `DashboardPage`'te; `AdminShell`'e ve alt görünümlere prop olarak iner.
- Mutasyonlar mevcut `api.*` çağrılarıyla; her başarıdan sonra `reload()` + toast. Yeni endpoint YOK.

## Hata/kenar durumları
- Yükleme: iskelet/"Yükleniyor…". Hata: mevcut kırmızı satır.
- Arama+filtre boş küme → "Sonuç yok".
- Küçük ekranda alt sekme çubuğu içerikle çakışmasın (`padding-bottom`).
- Reorder yalnız tek kategori görünümünde; "Tümü"de ▲▼ gizli/pasif.

## Test / doğrulama
- `npm run build` + `npm run lint` temiz.
- Backend testleri (`npm run test:server`) etkilenmez (API değişmiyor) — yine de yeşil kalmalı.
- Manuel: mobil (dar) ve masaüstü (geniş) genişlikte panelde arama, filtre, sıralama, form kaydet/sil, görünüm geçişleri, görsel ekleme.
- Statik export (`npm run export:menu`) çalışır kalır; admin statik-elde davranışı bozulmaz.

## Kapsam dışı (YAGNI)
- Sürükle-bırak sıralama (C yaklaşımı) — istenirse ayrı iş.
- Tablo görünümü / toplu işlemler.
- İstatistik paneli (#1) — ayrı iş.
- Yeni backend endpoint'i veya route.

## Riskler
- `DashboardPage`'ten `ProductsView`'e mantık taşınırken reorder/toggle regresyonu → mevcut `onMoveProduct`/`onToggleAvailable` mantığı birebir taşınacak.
- Alt sekme + sticky araç çubuğu z-index/scroll etkileşimi mobilde dikkat ister.
