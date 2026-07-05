// Menü arayüzünün TR/EN sözlüğü. Ürün/kategori verisi burada DEĞİL:
// asıl kaynak server/data.db (yönetim paneli), ilk kurulum tohumları
// server/seed-data.js dosyasındadır.
export const UI = {
  tr: {
    tagline: 'Boğaz Balık Restoranı', search: 'Menüde ara…', gf: 'Glütensiz', veg: 'Vejetaryen',
    market: 'Piyasa Fiyatı', ingredients: 'İçindekiler', allergens: 'Alerjenler', energy: 'Enerji',
    empty: 'Eşleşen yemek bulunamadı.', items: 'çeşit', gfShort: 'GLÜTENSİZ', vegShort: 'VEJETARYEN', noAlg: 'Bilinen alerjen yok.',
    favorites: 'Favoriler', noFav: 'Henüz favori eklemediniz.', popular: 'POPÜLER', chef: 'ŞEFİN ÖNERİSİ',
    loading: 'Menü yükleniyor…', home: 'Ana Sayfa', close: 'Kapat',
  },
  en: {
    tagline: 'Bosphorus Fish Restaurant', search: 'Search the menu…', gf: 'Gluten-Free', veg: 'Vegetarian',
    market: 'Market Price', ingredients: 'Ingredients', allergens: 'Allergens', energy: 'Energy',
    empty: 'No dishes match your search.', items: 'dishes', gfShort: 'GLUTEN-FREE', vegShort: 'VEGETARIAN', noAlg: 'No known allergens.',
    favorites: 'Favorites', noFav: 'No favorites yet.', popular: 'POPULAR', chef: "CHEF'S CHOICE",
    loading: 'Loading menu…', home: 'Home', close: 'Close',
  },
};
