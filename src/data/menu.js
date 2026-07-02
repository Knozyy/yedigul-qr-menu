export const CATEGORIES = [
  { id: 'cold', tr: 'Soğuk Mezeler', en: 'Cold Appetizers' },
  { id: 'hot', tr: 'Ara Sıcaklar', en: 'Hot Starters' },
  { id: 'fish', tr: 'Taze Balık', en: 'Fresh Fish' },
  { id: 'special', tr: 'Spesiyaller', en: 'Specials' },
  { id: 'salad', tr: 'Salatalar', en: 'Salads' },
  { id: 'dessert', tr: 'Tatlılar', en: 'Desserts' },
  { id: 'drink', tr: 'İçecekler', en: 'Beverages' },
];

export const ITEMS = [
  {
    id: 'fava', cat: 'cold', thumb: 'FAVA', price: 240, kcal: 100, diet: ['gf', 'veg'], popular: true,
    name: { tr: 'Fava', en: 'Broad Bean Purée' },
    desc: { tr: 'Zeytinyağlı fava, dereotu ve limon ile.', en: 'Olive-oil broad bean purée with dill and lemon.' },
    ing: { tr: ['Bakla', 'Soğan', 'Dereotu', 'Zeytinyağı', 'Limon'], en: ['Broad beans', 'Onion', 'Dill', 'Olive oil', 'Lemon'] },
    alg: { tr: [], en: [] },
  },
  {
    id: 'ahtapot', cat: 'cold', thumb: 'OCTOPUS', price: 560, kcal: 220, diet: ['gf'],
    name: { tr: 'Ahtapot Salatası', en: 'Octopus Salad' },
    desc: { tr: 'Közlenmiş ahtapot, kapari ve zeytinyağı.', en: 'Grilled octopus with capers and olive oil.' },
    ing: { tr: ['Ahtapot', 'Kapari', 'Kırmızı soğan', 'Zeytinyağı', 'Maydanoz'], en: ['Octopus', 'Capers', 'Red onion', 'Olive oil', 'Parsley'] },
    alg: { tr: ['Kabuklu deniz ürünleri'], en: ['Shellfish'] },
  },
  {
    id: 'levrekmarin', cat: 'cold', thumb: 'CURED', price: 480, kcal: 180, diet: ['gf'], chef: true,
    name: { tr: 'Levrek Marin', en: 'Cured Sea Bass' },
    desc: { tr: 'İnce dilimlenmiş levrek, narenciye ve pembe biber.', en: 'Thin-sliced sea bass with citrus and pink pepper.' },
    ing: { tr: ['Levrek', 'Limon', 'Portakal', 'Pembe biber', 'Zeytinyağı'], en: ['Sea bass', 'Lemon', 'Orange', 'Pink pepper', 'Olive oil'] },
    alg: { tr: ['Balık'], en: ['Fish'] },
  },

  {
    id: 'kalamar', cat: 'hot', thumb: 'CALAMARI', price: 420, kcal: 450, diet: [], popular: true,
    name: { tr: 'Kalamar Tava', en: 'Fried Calamari' },
    desc: { tr: 'Çıtır kalamar halkaları, tarator sos eşliğinde.', en: 'Crispy calamari rings served with tartar sauce.' },
    ing: { tr: ['Kalamar', 'Un', 'Mısır unu', 'Tarator', 'Limon'], en: ['Calamari', 'Flour', 'Cornmeal', 'Tartar', 'Lemon'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Glüten', 'Yumurta'], en: ['Shellfish', 'Gluten', 'Egg'] },
  },
  {
    id: 'karides', cat: 'hot', thumb: 'SHRIMP', price: 590, kcal: 380, diet: ['gf'], chef: true,
    name: { tr: 'Karides Güveç', en: 'Shrimp Casserole' },
    desc: { tr: 'Domates, sarımsak ve kaşar ile fırınlanmış karides.', en: 'Shrimp baked with tomato, garlic and cheese.' },
    ing: { tr: ['Karides', 'Domates', 'Sarımsak', 'Kaşar', 'Yeşil biber'], en: ['Shrimp', 'Tomato', 'Garlic', 'Cheese', 'Green pepper'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Süt'], en: ['Shellfish', 'Dairy'] },
  },
  {
    id: 'midye', cat: 'hot', thumb: 'MUSSELS', price: 300, kcal: 280, diet: [],
    name: { tr: 'Midye Dolma', en: 'Stuffed Mussels' },
    desc: { tr: 'Baharatlı iç pilav ile doldurulmuş taze midye.', en: 'Fresh mussels filled with spiced rice pilaf.' },
    ing: { tr: ['Midye', 'Pirinç', 'Kuş üzümü', 'Çam fıstığı', 'Baharat'], en: ['Mussels', 'Rice', 'Currants', 'Pine nuts', 'Spices'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Sert kabuklu yemiş'], en: ['Shellfish', 'Tree nuts'] },
  },

  {
    id: 'levrek', cat: 'fish', thumb: 'SEABASS', price: null, kcal: 280, diet: ['gf'], popular: true,
    name: { tr: 'Izgara Levrek', en: 'Grilled Sea Bass' },
    desc: { tr: 'Günlük taze levrek, kömür ızgarada, mevsim yeşillikleri ile.', en: 'Daily-fresh sea bass over charcoal with seasonal greens.' },
    ing: { tr: ['Levrek', 'Zeytinyağı', 'Limon', 'Roka', 'Deniz tuzu'], en: ['Sea bass', 'Olive oil', 'Lemon', 'Rocket', 'Sea salt'] },
    alg: { tr: ['Balık'], en: ['Fish'] },
  },
  {
    id: 'lufer', cat: 'fish', thumb: 'BLUEFISH', price: null, kcal: 350, diet: ['gf'],
    name: { tr: 'Lüfer', en: 'Bluefish' },
    desc: { tr: 'Boğaz’ın mevsimlik lüferi, ızgara veya tavada.', en: 'Seasonal Bosphorus bluefish, grilled or pan-fried.' },
    ing: { tr: ['Lüfer', 'Zeytinyağı', 'Limon', 'Soğan'], en: ['Bluefish', 'Olive oil', 'Lemon', 'Onion'] },
    alg: { tr: ['Balık'], en: ['Fish'] },
  },
  {
    id: 'cipura', cat: 'fish', thumb: 'BREAM', price: 640, kcal: 300, diet: ['gf'], popular: true,
    name: { tr: 'Izgara Çipura', en: 'Grilled Sea Bream' },
    desc: { tr: 'Kömür ızgara çipura, zeytinyağı ve limon ile.', en: 'Charcoal-grilled sea bream with olive oil and lemon.' },
    ing: { tr: ['Çipura', 'Zeytinyağı', 'Limon', 'Kekik'], en: ['Sea bream', 'Olive oil', 'Lemon', 'Thyme'] },
    alg: { tr: ['Balık'], en: ['Fish'] },
  },
  {
    id: 'kalkan', cat: 'fish', thumb: 'TURBOT', price: null, kcal: 420, diet: ['gf'],
    name: { tr: 'Kalkan', en: 'Turbot' },
    desc: { tr: 'Mevsiminde Karadeniz kalkanı, tereyağında.', en: 'Seasonal Black Sea turbot, pan-finished in butter.' },
    ing: { tr: ['Kalkan', 'Tereyağı', 'Limon', 'Maydanoz'], en: ['Turbot', 'Butter', 'Lemon', 'Parsley'] },
    alg: { tr: ['Balık', 'Süt'], en: ['Fish', 'Dairy'] },
  },
  {
    id: 'dil', cat: 'fish', thumb: 'SOLE', price: 820, kcal: 350, diet: ['gf'], chef: true,
    name: { tr: 'Dil Balığı', en: 'Dover Sole' },
    desc: { tr: 'Tereyağı ve limon soslu fırın dil balığı.', en: 'Oven-baked sole in a butter and lemon sauce.' },
    ing: { tr: ['Dil balığı', 'Tereyağı', 'Limon', 'Kapari'], en: ['Sole', 'Butter', 'Lemon', 'Capers'] },
    alg: { tr: ['Balık', 'Süt'], en: ['Fish', 'Dairy'] },
  },

  {
    id: 'tuzdalevrek', cat: 'special', thumb: 'SALT BAKE', price: null, kcal: 400, diet: ['gf'], chef: true,
    name: { tr: 'Tuzda Levrek', en: 'Salt-Baked Sea Bass' },
    desc: { tr: 'Tuz kabuğunda pişirilen bütün levrek, masada servis.', en: 'Whole sea bass baked in a salt crust, carved tableside.' },
    ing: { tr: ['Levrek', 'Deniz tuzu', 'Yumurta akı', 'Kekik', 'Limon'], en: ['Sea bass', 'Sea salt', 'Egg white', 'Thyme', 'Lemon'] },
    alg: { tr: ['Balık', 'Yumurta'], en: ['Fish', 'Egg'] },
  },
  {
    id: 'guvec', cat: 'special', thumb: 'SEAFOOD', price: 980, kcal: 520, diet: ['gf'], chef: true, popular: true,
    name: { tr: 'Deniz Mahsulleri Güveç', en: 'Seafood Casserole' },
    desc: { tr: 'Karides, midye, kalamar; domates soslu fırın güveç.', en: 'Shrimp, mussels and calamari in a baked tomato casserole.' },
    ing: { tr: ['Karides', 'Midye', 'Kalamar', 'Domates', 'Sarımsak'], en: ['Shrimp', 'Mussels', 'Calamari', 'Tomato', 'Garlic'] },
    alg: { tr: ['Kabuklu deniz ürünleri'], en: ['Shellfish'] },
  },

  {
    id: 'mevsim', cat: 'salad', thumb: 'GREENS', price: 190, kcal: 120, diet: ['gf', 'veg'],
    name: { tr: 'Mevsim Salata', en: 'Seasonal Greens' },
    desc: { tr: 'Taze mevsim yeşillikleri, nar ekşili sos ile.', en: 'Crisp seasonal greens with pomegranate dressing.' },
    ing: { tr: ['Marul', 'Roka', 'Domates', 'Salatalık', 'Nar ekşisi'], en: ['Lettuce', 'Rocket', 'Tomato', 'Cucumber', 'Pomegranate'] },
    alg: { tr: [], en: [] },
  },
  {
    id: 'roka', cat: 'salad', thumb: 'ROCKET', price: 230, kcal: 180, diet: ['gf', 'veg'],
    name: { tr: 'Roka & Parmesan', en: 'Rocket & Parmesan' },
    desc: { tr: 'Taze roka, parmesan ve balzamik glaze.', en: 'Fresh rocket with parmesan and balsamic glaze.' },
    ing: { tr: ['Roka', 'Parmesan', 'Balzamik', 'Zeytinyağı'], en: ['Rocket', 'Parmesan', 'Balsamic', 'Olive oil'] },
    alg: { tr: ['Süt'], en: ['Dairy'] },
  },

  {
    id: 'ayva', cat: 'dessert', thumb: 'QUINCE', price: 190, kcal: 350, diet: ['gf', 'veg'],
    name: { tr: 'Ayva Tatlısı', en: 'Quince Dessert' },
    desc: { tr: 'Kaymak ile servis edilen fırın ayva tatlısı.', en: 'Slow-baked quince served with clotted cream.' },
    ing: { tr: ['Ayva', 'Şeker', 'Karanfil', 'Kaymak'], en: ['Quince', 'Sugar', 'Clove', 'Clotted cream'] },
    alg: { tr: ['Süt'], en: ['Dairy'] },
  },
  {
    id: 'kunefe', cat: 'dessert', thumb: 'KUNEFE', price: 240, kcal: 450, diet: ['veg'], popular: true,
    name: { tr: 'Künefe', en: 'Künefe' },
    desc: { tr: 'Sıcak künefe, fıstık ve şerbet ile.', en: 'Warm shredded-pastry künefe with pistachio and syrup.' },
    ing: { tr: ['Kadayıf', 'Peynir', 'Şerbet', 'Antep fıstığı'], en: ['Shredded pastry', 'Cheese', 'Syrup', 'Pistachio'] },
    alg: { tr: ['Süt', 'Glüten', 'Sert kabuklu yemiş'], en: ['Dairy', 'Gluten', 'Tree nuts'] },
  },

  {
    id: 'raki', cat: 'drink', thumb: 'RAKI', price: 480, kcal: 800, diet: ['gf', 'veg'], popular: true,
    name: { tr: 'Rakı (35cl)', en: 'Rakı (35cl)' },
    desc: { tr: 'Geleneksel anason aroması, su ve buz ile.', en: 'Traditional anise spirit, served with water and ice.' },
    ing: { tr: ['Anason', 'Üzüm'], en: ['Anise', 'Grape'] },
    alg: { tr: [], en: [] },
  },
  {
    id: 'cay', cat: 'drink', thumb: 'TEA', price: 60, kcal: 2, diet: ['gf', 'veg'],
    name: { tr: 'Türk Çayı', en: 'Turkish Tea' },
    desc: { tr: 'İnce belli bardakta demli Rize çayı.', en: 'Brewed Rize tea in a tulip glass.' },
    ing: { tr: ['Siyah çay'], en: ['Black tea'] },
    alg: { tr: [], en: [] },
  },
  {
    id: 'ayran', cat: 'drink', thumb: 'AYRAN', price: 80, kcal: 110, diet: ['gf', 'veg'],
    name: { tr: 'Ayran', en: 'Ayran' },
    desc: { tr: 'Ev yapımı tuzlu yoğurt içeceği.', en: 'House-made salted yogurt drink.' },
    ing: { tr: ['Yoğurt', 'Su', 'Tuz'], en: ['Yogurt', 'Water', 'Salt'] },
    alg: { tr: ['Süt'], en: ['Dairy'] },
  },
];

export const UI = {
  tr: {
    tagline: 'Boğaz Balık Restoranı', search: 'Menüde ara…', gf: 'Glütensiz', veg: 'Vejetaryen',
    market: 'Piyasa Fiyatı', ingredients: 'İçindekiler', allergens: 'Alerjenler', energy: 'Enerji',
    empty: 'Eşleşen yemek bulunamadı.', items: 'çeşit', gfShort: 'GLÜTENSİZ', vegShort: 'VEJETARYEN', noAlg: 'Bilinen alerjen yok.',
    favorites: 'Favoriler', noFav: 'Henüz favori eklemediniz.', popular: 'POPÜLER', chef: 'ŞEFİN ÖNERİSİ',
    loading: 'Menü yükleniyor…',
  },
  en: {
    tagline: 'Bosphorus Fish Restaurant', search: 'Search the menu…', gf: 'Gluten-Free', veg: 'Vegetarian',
    market: 'Market Price', ingredients: 'Ingredients', allergens: 'Allergens', energy: 'Energy',
    empty: 'No dishes match your search.', items: 'dishes', gfShort: 'GLUTEN-FREE', vegShort: 'VEGETARIAN', noAlg: 'No known allergens.',
    favorites: 'Favorites', noFav: 'No favorites yet.', popular: 'POPULAR', chef: "CHEF'S CHOICE",
    loading: 'Loading menu…',
  },
};
