# Değerlendirme bekleme süresi — 6 Eylül 2026

Güncel kural: aynı tarayıcı/cihaz her 5 saatte bir tekrar değerlendirme yapabilir. Bu kural, Ağustos 2026 tasarım notlarındaki süresiz `rating_done` işaretinin ve sunucudaki 24 saatte 3 yorum sınırının yerini alır.

- Ortak süre `shared/rating-policy.js` içinde tanımlıdır.
- Menü `yedigul:rating_until` altında milisaniye cinsinden bitiş zamanını saklar. Sayfa yenilenince kalan süre korunur; süre dolunca sayfa yenilemeden yıldızlar ve değerlendirme düğmesi tekrar açılır.
- Sekmeye dönüşte ve diğer sekmedeki depolama değişikliklerinde durum yenilenir. Yeniden açılan form önceki puan/metni taşımaz.
- Tarih içermeyen eski `yedigul:rating_done=true` kayıtları okunmaz. Böylece önceki sürümde bir kez değerlendirme yapmış ziyaretçiler kalıcı kilitten çıkar.
- Site içi geri bildirim API’si son başarılı kaydın üzerinden 5 saat geçmeden aynı cihazı kabul etmez. Tam 5 saatte yeniden kabul eder; geçmiş yorumlar silinmez.
- 429 yanıtı `retryAfterMs` ve `Retry-After` içerir. Tarayıcı yeni bir 5 saat başlatmak yerine bu kalan süreyi kullanır.
- Mevcut 4–5 yıldız Google bağlantısı akışı korunur; tarayıcıdaki bekleme süresi bağlantı açıldığı anda başlar. Google’da yorumun gerçekten gönderildiği takip edilmez. Statik export’ta değerlendirme özelliğinin kapalı olması değişmez.

Doğrulama: `npm run test:server`, `CI=1 npx playwright test e2e/rating.spec.js`, `npm run lint`, `npm run build`. E2E testleri üretim veritabanı yerine bellekte test veritabanı kullanır; 5 saatlik eşik otomatik saat ilerletilerek sınanır.
