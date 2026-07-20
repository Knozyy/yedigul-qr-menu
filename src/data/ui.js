import { formatNumber } from '../lib/i18n.js';

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
    language: 'Dil seçimi', useLightTheme: 'Açık temaya geç', useDarkTheme: 'Koyu temaya geç',
    logoAlt: 'Yedigül logosu', locationShort: 'Anadolukavağı · İstanbul',
    locationLong: 'Anadolukavağı, Beykoz — İstanbul', categories: 'Kategoriler',
    clearSearch: 'Aramayı temizle', addFavorite: 'Favorilere ekle', removeFavorite: 'Favorilerden çıkar',
    loadError: 'Menü şu anda yüklenemiyor.', retry: 'Yeniden dene', dishImage: 'Ürün görseli',
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
    language: 'Language selection', useLightTheme: 'Switch to light theme', useDarkTheme: 'Switch to dark theme',
    logoAlt: 'Yedigül logo', locationShort: 'Anadolukavağı · Istanbul',
    locationLong: 'Anadolukavağı, Beykoz — Istanbul', categories: 'Categories',
    clearSearch: 'Clear search', addFavorite: 'Add to favourites', removeFavorite: 'Remove from favourites',
    loadError: 'The menu could not be loaded right now.', retry: 'Try again', dishImage: 'Dish image',
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
    language: 'اختيار اللغة', useLightTheme: 'التبديل إلى الوضع الفاتح', useDarkTheme: 'التبديل إلى الوضع الداكن',
    logoAlt: 'شعار Yedigül', locationShort: 'أناضولو كافاغي · إسطنبول',
    locationLong: 'أناضولو كافاغي، بيكوز — إسطنبول', categories: 'الفئات',
    clearSearch: 'مسح البحث', addFavorite: 'إضافة إلى المفضلة', removeFavorite: 'إزالة من المفضلة',
    loadError: 'تعذر تحميل القائمة الآن.', retry: 'إعادة المحاولة', dishImage: 'صورة الطبق',
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
    language: 'Выбор языка', useLightTheme: 'Включить светлую тему', useDarkTheme: 'Включить тёмную тему',
    logoAlt: 'Логотип Yedigül', locationShort: 'Анадолукавагы · Стамбул',
    locationLong: 'Анадолукавагы, Бейкоз — Стамбул', categories: 'Категории',
    clearSearch: 'Очистить поиск', addFavorite: 'Добавить в избранное', removeFavorite: 'Удалить из избранного',
    loadError: 'Сейчас не удалось загрузить меню.', retry: 'Повторить', dishImage: 'Фото блюда',
  },
};

// Fiyat biçimi referans tasarımdan: TR "650 TL", EN "₺650", AR "650 ل.ت", RU "650 ₺".
export function fmtPrice(n, lang) {
  const number = formatNumber(n, lang);
  if (lang === 'tr') return `${number} TL`;
  if (lang === 'ar') return `${number} ل.ت`;
  if (lang === 'ru') return `${number} ₺`;
  return `₺${number}`;
}

export function fmtPriceRange(a, b, lang) {
  if (a === b) return fmtPrice(a, lang);
  const start = formatNumber(a, lang);
  const end = formatNumber(b, lang);
  if (lang === 'tr') return `${start}–${end} TL`;
  if (lang === 'ar') return `${start}–${end} ل.ت`;
  if (lang === 'ru') return `${start}–${end} ₺`;
  return `₺${start}–${end}`;
}
