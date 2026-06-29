# Yedigül Restaurant QR Menü Sistemi - Yol Haritası (Roadmap)

Bu belge, Anadolukavağı Yedigül Restaurant için tasarlanacak olan QR Menü projesinin geliştirme süreçlerini ve fazlarını tanımlar.

---

## Proje Vizyonu
Yedigül Restaurant için kilitlenen teknoloji yığını **React (Vite) + TailwindCSS + Firebase** olarak belirlenmiştir. Tasarım dili olarak derin lacivert, beyaz ve altın sarısı tonlarını barındıran **Marin (Boğaz) Teması** benimsenecektir. **Sistem sadece mobil ve tablet ekranlara uygun şekilde geliştirilecek, her özellik teslim edilmeden önce mutlaka mobil responsive uyumluluğu açısından test edilecektir.** Masaüstü ekran tasarımları kapsam dışıdır.

---

## Geliştirme Fazları

### 🎯 Faz 1: Analiz, Tasarım ve Hazırlık (Tamamlandı/Mevcut)
*   [x] Teknoloji yığınının seçilmesi (React/Vite, Tailwind, Firebase).
*   [x] Tasarım temasının belirlenmesi (Marin konsepti).
*   [x] QR kod yapısının kararlaştırılması (Masa bazlı dinamik URL yapısı).
*   [x] Günlük fiyat esnekliğinin planlanması ("Piyasa Fiyatı" / Sayısal Giriş).
*   [x] Mobil/Tablet odaklı tasarım kuralının kilitlenmesi ve AGENTS.md dosyasına eklenmesi.
*   [ ] Firebase projesinin kurulması ve konfigürasyon dosyalarının hazırlanması.

### 📱 Faz 2: Müşteri Menü Arayüzü (Müşteri Mobil Ekranları)
*   [ ] Mobil ve tablet uyumlu (Mobile-First) responsive müşteri arayüzü tasarımı.
*   [ ] Marin temasına uygun CSS/Tailwind ayarlarının yapılması.
*   [ ] **Çoklu Dil Desteği:** i18n altyapısıyla Türkçe ve İngilizce dillerinin entegre edilmesi.
*   [ ] **Kategori ve Ürün Listeleme:**
    *   Mezeler, Balıklar, Spesiyaller, Salatalar, Tatlılar ve İçecekler.
    *   Taze balıklar için sayısal fiyat veya **"Piyasa Fiyatı"** gösterimi.
*   [ ] Mobil uyumlu arama çubuğu ve kategori bazlı filtreleme özellikleri.
*   [ ] **Mobil Test ve Doğrulama:** Arayüzün tüm mobil boyutlarında taşmasız çalıştığının doğrulanması.

### ⚙️ Faz 3: Yönetim Paneli (Admin Portal - Mobil Uyumlu)
*   [ ] Firebase Authentication ile güvenli yönetici girişi.
*   [ ] **Menü Yönetim Modülü (CRUD):** Mobil cihazdan kolayca yönetilebilecek yeni kategori ekleme, ürün ekleme/çıkarma, stok durumu kontrolü.
*   [ ] **Hızlı Fiyat ve Durum Güncelleyici:** Sabah fiyatlarını mobil arayüzden saniyeler içinde güncelleyebilme veya "Piyasa Fiyatı" moduna alabilme ekranı.
*   [ ] **Masa ve QR Kod Yönetimi:** Masalara ait dinamik QR kodları sistem üzerinden üretebilme.
*   [ ] **Mobil Test ve Doğrulama:** Admin panelinin mobil/tablet uyumluluk testi.

### 🔔 Faz 4: Yayına Alma ve Canlıya Geçiş
*   [ ] Firebase Hosting ile uygulamanın canlıya alınması.
*   [ ] Domain (örn: `menu.yedigul.com` veya `yedigul.com/menu`) yönlendirmesi.
*   [ ] Baskıya hazır QR kod taslaklarının oluşturulması.

---

*Not: İlerleyen fazlarda bu dinamik QR altyapısı kullanılarak gerçek zamanlı garson çağırma ve sipariş verme entegrasyonu (Faz 5) aktif edilebilecektir.*
