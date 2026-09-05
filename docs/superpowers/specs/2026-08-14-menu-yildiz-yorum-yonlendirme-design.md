# Menüde Yıldız Değerlendirme ve Yorum Yönlendirme

Tarih: 2026-08-14
Durum: onaylandı, uygulanacak

## Amaç

QR menüde misafire yıldız sorulur. 4 ve üstü verenler Google Maps yorum
kutusuna yönlendirilir; 4'ün altında verenler site içinde açılan bir forma
yazar ve bu yazı yalnızca yönetim paneline düşer.

## Kapsam dışı

Sipariş, masa eşleştirme, garson çağırma yok — projenin mevcut sınırı korunur.
Yorum moderasyonu, yanıtlama, dışa aktarma bu sürümde yok.

## Bilinen risk (kullanıcı bilgilendirildi ve onayladı)

Düşük puanlıya Google yolunun tamamen kapatılması "review gating" tanımına
girer ve Google katkı politikalarınca yasaktır; yaptırım riski işletme
profilindedir. Kullanıcı riski bilerek bu davranışı seçti. Politikaya uygun
varyant (teşekkür ekranında küçük Google linki) reddedildi. İleride
gerekirse dönüş noktası: `RatingPrompt` teşekkür durumuna link eklemek —
başka hiçbir yeri etkilemez.

## Mimari

Yeni katman veya bağımlılık yok. Üç mevcut desenin üstüne oturur:

1. Ayarlar `settings` tablosunda `info_*` anahtarlarıyla tutulur ve panelden
   düzenlenir (`InfoPanel.jsx`).
2. Açık uç noktalar `server/routes/menu.js` içinde, cihaz kimliği gövdede
   `id` alanı olarak gelir (`src/lib/deviceId.js`).
3. Şema `server/db.js` içinde `CREATE TABLE IF NOT EXISTS` ile idempotent
   kurulur; ayrı migration aracı yok.

## 1. Veri katmanı

`server/db.js` şemasına eklenir:

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  rating     INTEGER NOT NULL,
  message    TEXT NOT NULL,
  lang       TEXT NOT NULL DEFAULT 'tr',
  device_id  TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
```

`device_id` products/categories gibi bir tabloya foreign key ile bağlanmaz;
cihaz kimliği kalıcı bir varlık değil, yalnızca hız sınırı anahtarıdır.

Yeni ayar anahtarı: `info_google_review_url`. Varsayılanı boş dizedir.

### Hız sınırı yardımcısı

`server/db.js`'e `canSubmitFeedback(db, deviceId)`: son 24 saatte aynı
`device_id` ile 3 veya daha fazla kayıt varsa `false`. `menu_views`'taki
pencere mantığının aynısı, ama kayıtlar silinmez — geri bildirim veridir,
sayaç değildir; pencere sorgu ile hesaplanır.

## 2. API

### `POST /api/menu/feedback`

Açık uç. Gövde: `{ id, rating, message, lang }`.

| Durum | Yanıt |
|---|---|
| `rating` tamsayı değil veya 1–3 dışında | 400 `{ ok: false, error: 'rating' }` |
| `message` kırpılınca boş veya > 1000 karakter | 400 `{ ok: false, error: 'message' }` |
| `id` boş | 400 `{ ok: false, error: 'device' }` |
| 24 saatte 3 kayıt aşıldı | 429 `{ ok: false, error: 'limit' }` |
| Başarılı | 200 `{ ok: true }` |

`rating` 4 ve 5 sunucuya **hiç gelmez** ve 400 döner. Sözleşme böyle
daraltılır: bu tablo yalnızca "site içinde kalan" geri bildirimi tutar,
yüksek puan Maps'e gider ve bizde kaydı olmaz.

`lang` `LANGUAGE_CODES` dışındaysa `'tr'`e düşer, hata değildir.

### `GET /api/menu/`

`publicMeta` çıktısına `info.google_review_url` eklenir. Diğer `info_*`
alanlarıyla aynı şekilde okunur, çeviri alanı yoktur (tek URL).

### Admin uçları (mevcut auth + `audit_log` deseni)

- `GET /api/admin/feedback?from&to` — tarih aralığı isteğe bağlı,
  parametresiz çağrı son 30 günü verir. Yanıt: `{ items, unread }`.
- `PATCH /api/admin/feedback/:id/read` — `{ is_read: true|false }`.
- `DELETE /api/admin/feedback/:id`.

Silme `audit_log`'a yazılır; okundu işaretleme yazılmaz (gürültü olur).

## 3. Menü arayüzü

### `src/components/RatingPrompt.jsx`

Tek sorumluluk: yıldız durum makinesi. Dört durum:

- `idle` — 5 yıldız, tıklanabilir.
- `form` — yalnız 1–3 seçilince. Metin alanı + Gönder. Boşken Gönder pasif.
- `sending` — Gönder pasif, iki kez gönderim engellenir.
- `done` — teşekkür metni. Ağ hatasında da `done` gösterilir mi? Hayır:
  hata durumunda `form`'a dönülür ve hata metni gösterilir, misafir tekrar
  dener. 429'da ayrı metin ("zaten paylaştınız") ve `done`a geçilir.

4–5 yıldızda: `window.open(url, '_blank', 'noopener')` **tıklama işleyicisi
içinde, senkron** çağrılır, sonra `done`a geçilir. Async bir istekten sonra
açılırsa mobil tarayıcı popup'ı bloklar. Yüksek puan için sunucuya istek
gönderilmez.

`google_review_url` boşsa bileşen `null` döner — hiçbir yerde render olmaz.

Props: `ui`, `lang`, `reviewUrl`, `onDone`.

### `src/components/RatingStrip.jsx`

`RatingPrompt`'u saran, alttan kayan tek seferlik şerit. Kapatma düğmesi var.

Tetik koşulu (hepsi birden): menüde 60 saniye geçti **ve** sayfanın %40'ı
kaydırıldı. Kayıt: `readStorage`/`writeStorage` ile
`rating_done` ve `rating_strip_seen`. İkisinden biri doluysa şerit hiç
kurulmaz — zamanlayıcı bile başlamaz.

Şerit `BottomSheet` açıkken görünmez; ürün detayını örtmemeli.

### `MenuPage.jsx` bağlantısı

- Footer'da `Yedigül` imzasının **üstüne** kalıcı `RatingPrompt` bloğu.
- Sayfa köküne `RatingStrip`.
- Ortak durum: puan verildiğinde `rating_done` yazılır, footer bloğu da
  teşekkür durumuna geçer. Tek kaynak `MenuPage`'de bir `rated` state'i;
  iki bileşen de bunu okur. İki ayrı "verildi" tanımı olmasın.

### Çok dillilik

Tüm metinler `src/data/ui.js` içindeki `UI` sözlüğüne dört dilde eklenir:
başlık, yıldız `aria-label`'ları, form etiketi, yer tutucu, Gönder, teşekkür,
hata, limit metni, kapat.

`dir="rtl"` altında yıldız sırası ve şerit yerleşimi ayrıca gözle doğrulanır.

Frontend'de yorum satırı yazılmaz (proje kuralı); sunucu tarafında Türkçe
açıklama yorumları mevcut desene uyarak yazılır.

## 4. Panel

### `src/components/admin/FeedbackView.jsx`

Liste: tarih, yıldız, mesaj, okundu düğmesi, sil. Okunmamışlar üstte
vurgulu. Boş durum metni var. Tarih aralığı filtresi `OverviewView`'daki
mevcut aralık deseniyle aynı.

`AdminNav`'a "Geri Bildirimler" sekmesi; okunmamış sayısı rozette.

### `InfoPanel.jsx`

`info_google_review_url` alanı eklenir. Yardım metni: Google Business
Profile → "Yorum iste" linkinin (`https://g.page/r/...`) buraya yapıştırılacağı.
Boş bırakılırsa menüde yıldız bloğunun görünmeyeceği alanın altında yazar.

Doğrulama: boş veya `https://` ile başlayan bir URL kabul edilir; başka
şema reddedilir (400). `javascript:` gibi bir değerin menüde bir bağlantıya
dönüşmesi engellenir.

## 5. Test

### `server/test/feedback.test.js`

- `rating` 0, 4, 5, 6, `"3"`, eksik → 400.
- `message` boş, yalnız boşluk, 1001 karakter → 400; 1000 karakter → 200.
- `id` eksik → 400.
- Aynı cihazla 4. gönderim → 429; farklı cihaz etkilenmez.
- `lang` bilinmeyen değer → kayıt `tr` olarak yazılır, 200.
- `GET /api/admin/feedback` auth'suz → 401; auth'lu → kayıtlar + `unread`.
- `PATCH .../read` ve `DELETE` çalışır; silme `audit_log`'a düşer.
- `info_google_review_url` `javascript:` ile kaydedilemez.

### E2E (`npm run test:e2e`)

- Maps linki boşken menüde yıldız bloğu yok.
- Link doluyken 5 yıldız → yeni sekme açılır, sunucuya kayıt gitmez.
- 2 yıldız → form açılır, gönderilir, panelde görünür.
- Puan verdikten sonra sayfa yenilenince şerit çıkmaz.

## Açık iş

`info_google_review_url` değerinin kendisi kullanıcıdan gelecek. Gelene
kadar alan boş kalır ve özellik canlıda kapalıdır — geliştirme ve testler
bundan bağımsız tamamlanabilir.
