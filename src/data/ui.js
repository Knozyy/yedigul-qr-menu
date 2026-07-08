// Menü arayüzünün TR/EN/AR/RU sözlüğü. Ürün/kategori verisi burada DEĞİL:
// asıl kaynak server/data.db (yönetim paneli), ilk kurulum tohumları
// server/seed-data.js dosyasındadır.
export const UI = {
  tr: {
    tagline: 'Boğaz Balık Restoranı', search: 'Menüde ara…', gf: 'Glütensiz', veg: 'Vejetaryen',
    market: 'Piyasa Fiyatı', ingredients: 'İçindekiler', allergens: 'Alerjenler', energy: 'Enerji',
    empty: 'Eşleşen yemek bulunamadı.', items: 'çeşit', gfShort: 'GLÜTENSİZ', vegShort: 'VEJETARYEN', noAlg: 'Bilinen alerjen yok.',
    favorites: 'Favoriler', noFav: 'Henüz favori eklemediniz.', popular: 'POPÜLER', chef: 'ŞEFİN ÖNERİSİ',
    loading: 'Menü yükleniyor…', home: 'Ana Sayfa', close: 'Kapat',
    options: 'Porsiyonlar', hours: 'Çalışma Saatleri', phone: 'Telefon', wifi: 'Wi-Fi Şifresi',
    currency: 'TL', kcalUnit: 'kcal',
  },
  en: {
    tagline: 'Bosphorus Fish Restaurant', search: 'Search the menu…', gf: 'Gluten-Free', veg: 'Vegetarian',
    market: 'Market Price', ingredients: 'Ingredients', allergens: 'Allergens', energy: 'Energy',
    empty: 'No dishes match your search.', items: 'dishes', gfShort: 'GLUTEN-FREE', vegShort: 'VEGETARIAN', noAlg: 'No known allergens.',
    favorites: 'Favorites', noFav: 'No favorites yet.', popular: 'POPULAR', chef: "CHEF'S CHOICE",
    loading: 'Loading menu…', home: 'Home', close: 'Close',
    options: 'Portions', hours: 'Opening Hours', phone: 'Phone', wifi: 'Wi-Fi Password',
    currency: 'TL', kcalUnit: 'kcal',
  },
  ar: {
    tagline: 'مطعم أسماك البوسفور', search: 'ابحث في القائمة…', gf: 'خالٍ من الغلوتين', veg: 'نباتي',
    market: 'سعر السوق', ingredients: 'المكوّنات', allergens: 'مسبّبات الحساسية', energy: 'الطاقة',
    empty: 'لا توجد أطباق مطابقة لبحثك.', items: 'صنف', gfShort: 'خالٍ من الغلوتين', vegShort: 'نباتي', noAlg: 'لا توجد مسبّبات حساسية معروفة.',
    favorites: 'المفضّلة', noFav: 'لا توجد أطباق مفضّلة بعد.', popular: 'الأكثر طلباً', chef: 'اختيار الشيف',
    loading: 'جارٍ تحميل القائمة…', home: 'الصفحة الرئيسية', close: 'إغلاق',
    options: 'الأحجام', hours: 'ساعات العمل', phone: 'الهاتف', wifi: 'كلمة سر الواي فاي',
    currency: 'ل.ت', kcalUnit: 'سعرة',
  },
  ru: {
    tagline: 'Рыбный ресторан на Босфоре', search: 'Поиск по меню…', gf: 'Без глютена', veg: 'Вегетарианское',
    market: 'Рыночная цена', ingredients: 'Состав', allergens: 'Аллергены', energy: 'Энергия',
    empty: 'Ничего не найдено.', items: 'блюд', gfShort: 'БЕЗ ГЛЮТЕНА', vegShort: 'ВЕГЕТАРИАНСКОЕ', noAlg: 'Известных аллергенов нет.',
    favorites: 'Избранное', noFav: 'Пока нет избранных блюд.', popular: 'ПОПУЛЯРНОЕ', chef: 'ВЫБОР ШЕФА',
    loading: 'Загрузка меню…', home: 'Главная', close: 'Закрыть',
    options: 'Порции', hours: 'Часы работы', phone: 'Телефон', wifi: 'Пароль Wi-Fi',
    currency: '₺', kcalUnit: 'ккал',
  },
};
