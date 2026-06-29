# Yedigül Restaurant QR Menü Projesi - Yapılacaklar (TODO)

## Faz 1: Analiz, Tasarım ve Hazırlık
- [x] İş gereksinimlerini detaylandır ve onay al (Grill-me tamamlandı)
- [x] Teknoloji yığınını belirle ve kilitle (React/Vite + TailwindCSS + Firebase)
- [x] UI/UX tasarım temasını belirle (Marin Teması - Lacivert/Beyaz/Altın)
- [x] Mobil ve tablet odaklı geliştirme/test kuralını kitle (AGENTS.md oluşturuldu)
- [x] Yol haritasını ve fazları güncelle
- [ ] Firebase üzerinde yeni bir proje oluştur ve Firebase CLI ile yerel yapılandırmayı tamamla

## Faz 2: Müşteri Menü Arayüzü (Müşteri Ekranları - Mobil Sadece)
- [ ] React (Vite) projesini yerel dizinde ayağa kaldır
- [ ] Tailwind CSS yapılandırmasını Marin renk paletine göre ayarla (`tailwind.config.js`)
- [ ] i18next kütüphanesini kullanarak Türkçe/İngilizce dil yapısını kur
- [ ] Mobil uyumlu menü arayüzünü (Kategoriler, Ürün Kartları, Arama) tasarla
- [ ] Ürün kartlarında "Piyasa Fiyatı" (Market Price) gösterim mantığını kodla
- [ ] **Mobil Doğrulama:** Arayüzün tüm popüler mobil ekran boyutlarında (320px - 768px) kusursuz çalıştığını test et ve doğrula

## Faz 3: Yönetim Paneli (Admin Portal - Mobil & Tablet Uyumlu)
- [ ] Firebase Auth entegrasyonu ile yönetici login sayfasını yap
- [ ] Firestore veritabanı kurallarını ve bağlantılarını hazırla
- [ ] Kategori CRUD (Ekleme/Silme/Sıralama) işlemlerini yaz (Mobil odaklı UI)
- [ ] Ürün CRUD işlemlerini yaz (Fiyat, resim, açıklama, "Piyasa Fiyatı" checkbox'ı)
- [ ] Dinamik Masa ve QR URL oluşturucu bileşenini geliştir
- [ ] **Mobil Doğrulama:** Admin panelinin telefondan kolayca yönetilebilir olduğunu test et ve doğrula

## Faz 4: Yayına Alma ve Testler
- [ ] Firebase Hosting dağıtım ayarlarını yap
- [ ] Domain yönlendirmesini tamamla
- [ ] Mobil tarayıcı testlerini (iOS Safari / Android Chrome) gerçekleştir
