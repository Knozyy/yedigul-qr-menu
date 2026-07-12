// Menü arayüzünün TR/EN/AR/RU sözlüğü. Ürün/kategori verisi burada DEĞİL:
// asıl kaynak server/data.db (yönetim paneli), ilk kurulum tohumları
// server/seed-data.js dosyasındadır.
export const UI = {
  tr: {
    sub: 'Balık Lokantası', tagline: 'Boğaz Balık Restoranı', search: 'Menüde ara…',
    gf: 'Glutensiz', veg: 'Vejetaryen', favorites: 'Favorilerim',
    market: 'Piyasa Fiyatı',
    marketNote: 'Mevsimlik üründür; günün fiyatını servis ekibimizden öğrenebilirsiniz.',
    ingredients: 'İçindekiler', allergens: 'Alerjenler',
    items: 'çeşit', noAlg: 'Bilinen alerjen yok.',
    popular: 'Popüler', chef: 'Şefin Önerisi',
    options: 'Porsiyon Seçenekleri',
    clear: 'Filtreleri temizle',
    emptySearchT: 'Sonuç bulunamadı', emptySearchS: 'Aramanız veya filtrelerinizle eşleşen ürün yok.',
    emptyFavT: 'Henüz favoriniz yok', emptyFavS: 'Beğendiğiniz ürünlerin kalbine dokunun; burada toplansın.',
    vat: 'Fiyatlarımıza KDV dahildir. Kalori değerleri ortalama porsiyon içindir.',
    priceUpdated: 'Fiyat güncellenme tarihi',
    loading: 'Menü yükleniyor…', home: 'Ana Sayfa', close: 'Kapat', toTop: 'Başa dön',
    hours: 'Çalışma Saatleri', phone: 'Telefon', wifi: 'Wi-Fi',
    kcalUnit: 'kcal',
  },
  en: {
    sub: 'Fish Restaurant', tagline: 'Bosphorus Fish Restaurant', search: 'Search the menu…',
    gf: 'Gluten-free', veg: 'Vegetarian', favorites: 'Favourites',
    market: 'Market Price',
    marketNote: 'Seasonal catch — please ask our team for today’s price.',
    ingredients: 'Ingredients', allergens: 'Allergens',
    items: 'items', noAlg: 'No known allergens.',
    popular: 'Popular', chef: "Chef's Choice",
    options: 'Portion Options',
    clear: 'Clear filters',
    emptySearchT: 'No results found', emptySearchS: 'Nothing matches your search or filters.',
    emptyFavT: 'No favourites yet', emptyFavS: 'Tap the heart on dishes you like and they will gather here.',
    vat: 'Prices include VAT. Calorie values are per average portion.',
    priceUpdated: 'Prices last updated',
    loading: 'Loading menu…', home: 'Home', close: 'Close', toTop: 'Back to top',
    hours: 'Opening Hours', phone: 'Phone', wifi: 'Wi-Fi',
    kcalUnit: 'kcal',
  },
  ar: {
    sub: 'مطعم أسماك', tagline: 'مطعم أسماك البوسفور', search: 'ابحث في القائمة…',
    gf: 'خالٍ من الغلوتين', veg: 'نباتي', favorites: 'المفضلة',
    market: 'سعر السوق',
    marketNote: 'صيد موسمي — يرجى سؤال فريق الخدمة عن سعر اليوم.',
    ingredients: 'المكونات', allergens: 'مسببات الحساسية',
    items: 'صنف', noAlg: 'لا توجد مسبّبات حساسية معروفة.',
    popular: 'رائج', chef: 'اختيار الشيف',
    options: 'خيارات الحصص',
    clear: 'مسح عوامل التصفية',
    emptySearchT: 'لا توجد نتائج', emptySearchS: 'لا يوجد ما يطابق بحثك أو عوامل التصفية.',
    emptyFavT: 'لا مفضلات بعد', emptyFavS: 'اضغط على القلب بجانب الأطباق التي تعجبك لتُجمع هنا.',
    vat: 'الأسعار شاملة الضريبة. قيم السعرات لكل حصة متوسطة.',
    priceUpdated: 'آخر تحديث للأسعار',
    loading: 'جارٍ تحميل القائمة…', home: 'الصفحة الرئيسية', close: 'إغلاق', toTop: 'العودة إلى الأعلى',
    hours: 'ساعات العمل', phone: 'الهاتف', wifi: 'واي فاي',
    kcalUnit: 'سعرة',
  },
  ru: {
    sub: 'Рыбный ресторан', tagline: 'Рыбный ресторан на Босфоре', search: 'Поиск по меню…',
    gf: 'Без глютена', veg: 'Вегетарианское', favorites: 'Избранное',
    market: 'Цена дня',
    marketNote: 'Сезонная рыба — уточните цену дня у официанта.',
    ingredients: 'Состав', allergens: 'Аллергены',
    items: 'поз.', noAlg: 'Известных аллергенов нет.',
    popular: 'Хит', chef: 'От шефа',
    options: 'Варианты порций',
    clear: 'Сбросить фильтры',
    emptySearchT: 'Ничего не найдено', emptySearchS: 'Ничего не найдено по вашему запросу или фильтрам.',
    emptyFavT: 'Пока нет избранного', emptyFavS: 'Нажимайте на сердечко у понравившихся блюд — они появятся здесь.',
    vat: 'Цены включают НДС. Калорийность указана на среднюю порцию.',
    priceUpdated: 'Цены обновлены',
    loading: 'Загрузка меню…', home: 'Главная', close: 'Закрыть', toTop: 'Наверх',
    hours: 'Часы работы', phone: 'Телефон', wifi: 'Wi-Fi',
    kcalUnit: 'ккал',
  },
};

// Fiyat biçimi referans tasarımdan: TR "650 TL", EN "₺650", AR "650 ل.ت", RU "650 ₺".
export function fmtPrice(n, lang) {
  if (lang === 'tr') return `${n} TL`;
  if (lang === 'ar') return `${n} ل.ت`;
  if (lang === 'ru') return `${n} ₺`;
  return `₺${n}`;
}

export function fmtPriceRange(a, b, lang) {
  if (a === b) return fmtPrice(a, lang);
  if (lang === 'tr') return `${a}–${b} TL`;
  if (lang === 'ar') return `${a}–${b} ل.ت`;
  if (lang === 'ru') return `${a}–${b} ₺`;
  return `₺${a}–${b}`;
}
