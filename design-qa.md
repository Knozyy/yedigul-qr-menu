# Yedigül QR Menü — Design QA

## Karşılaştırma hedefi

- Kaynak görsel gerçekliği:
  - `test-results/menu-before-mobile-normalized.png` — önceki menü arayüzü.
  - `test-results/homepage-modern-hero.png` — yeni ana sayfanın marka, renk ve tipografi hedefi.
- Uygulama kanıtı:
  - `test-results/menu-modern-mobile.png`
  - `test-results/menu-modern-desktop.png`
  - `test-results/menu-modern-detail.png`
- Rota: `http://localhost:3101/menu/`
- Durum: TR, açık tema, gerçek API/SQLite menü verisi.

## Görüntü normalizasyonu

- Kaynak mobil yakalama: 375 × 812 px; 390 × 844 px hedefe yüksek kaliteli bicubic ölçekleme ile normalize edildi.
- Uygulama mobil yakalama: 390 × 844 px; CSS viewport 390 × 844, yoğunluk 1×.
- Masaüstü uygulama yakalama: 1440 × 900 px; CSS viewport 1440 × 900, yoğunluk 1×.
- Kaynak ve uygulama mobil görselleri aynı 390 × 844 px karşılaştırma girdisinde birlikte incelendi.

## Tam görünüm karşılaştırması

- Tipografi: Cormorant Garamond başlıklar ve Jost arayüz metinleri ana sayfayla aynı hiyerarşiyi kuruyor; küçük fiyat ve filtre metinleri okunaklı.
- Aralık ve düzen ritmi: Başlık, arama kartı, yapışkan kategori şeridi ve ürün kartları tek bir dikey akış oluşturuyor. Mobilde ilk ürün ilk viewport içinde tamamen görünüyor.
- Renk ve tokenlar: Lacivert, krem ve kontrollü altın vurgular ana sayfayla eşleşiyor; açık/koyu tema semantik tokenlar üzerinden korunuyor.
- Görsel kalite: Mevcut logo, gerçek yemek fotoğrafları ve veri kaynağındaki ürün görselleri kullanıldı. Bozuk görsel veya yatay taşma görülmedi.
- Metin ve içerik: Yeni görünür metinler TR/EN/AR/RU sözlüklerine eklendi; RTL Arapça düzeni doğrulandı.

## Odaklı bölge karşılaştırması

- `test-results/menu-modern-detail.png` üzerinde ürün fotoğrafı, rozet, favori, fiyat, kalori, porsiyon, içerik ve alerjen hiyerarşisi incelendi.
- Ürün detay paneli 390 px genişlikte tam oturuyor; arka plan kaydırması kilitleniyor ve kapatma davranışı çalışıyor.

## Bulgular

- P0/P1/P2 açık bulgu yok.
- P3: Masaüstünde editoryal giriş nedeniyle ilk ürün kartı viewport alt sınırında başlıyor. Arama ve kategoriler ilk ekranda kaldığı için kullanım engeli oluşturmuyor.

## Karşılaştırma geçmişi

1. İlk uygulama geçişi:
   - [P2] Mobil editoryal giriş, ilk ürün kartını 844 px viewport dışına itiyordu.
   - Düzeltme: Tekrarlanan giriş metni 760 px ve altında kaldırıldı; marka mesajı hero içinde korundu.
2. Düzeltme sonrası:
   - İlk ürün kartı 650–797 px aralığına taşındı ve ilk viewport içinde tamamen görünür oldu.
   - Kategori geçişi uzun menülerde gecikmesiz hedefe gidecek şekilde düzeltildi.

## Etkileşim ve teknik doğrulama

- Arama: “levrek” sorgusu 10 ürüne ve 3 bölüme filtrelendi; temizleme butonu 199 ürün ve 12 bölümü geri getirdi.
- Kategori: “Tatlılar” hedefi yapışkan şeridin 76 px altına hizalandı ve aktif durum güncellendi.
- Ürün detayı, favori kontrolü, tema geçişi, TR/EN/AR/RU ve RTL yönü doğrulandı.
- Mobil 390 × 844, tablet 768 × 900 ve masaüstü 1440 × 900 düzenlerinde yatay taşma yok.
- Tarayıcı konsolunda hata veya uyarı yok.
- Lint ve üretim derlemesi geçti; 146 sunucu testi ve 12 E2E testi başarılı.

## Uygulama kontrol listesi

- [x] Mobilde ürünler ilk ekranda erişilebilir.
- [x] Arama, filtre, kategori ve ürün detay akışı çalışıyor.
- [x] Açık/koyu tema ve dört dil korunuyor.
- [x] Ana sayfa tasarım sistemiyle görsel bütünlük sağlandı.
- [x] Responsive taşma ve bozuk görsel kontrolü geçti.

final result: passed
