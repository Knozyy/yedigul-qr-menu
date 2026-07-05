// ============================================================================
// DİKKAT — BU DOSYA MENÜNÜN TOHUM (SEED) VERİSİDİR.
//
// Fiziksel menü panosundan (2026-07) alınan gerçek menü. Veritabanı
// (server/data.db) bir kez oluşturulduktan sonra menünün tek gerçek kaynağı
// veritabanıdır; ürün/fiyat/kalori/gram değişiklikleri YÖNETİM PANELİNDEN
// yapılır. Bu dosyayı düzenlemek mevcut kurulumu ETKİLEMEZ; yalnızca sıfırdan
// (boş data.db ile) kurulan sunucularda kullanılır.
//
// Mevcut bir data.db'ye bu menüyü uygulamak için: `node scripts/import-menu.mjs`
// ============================================================================

export const CATEGORIES = [
  { id: 'fish', tr: 'Balık', en: 'Fresh Fish' },
  { id: 'hot', tr: 'Ara Sıcaklar', en: 'Hot Starters' },
  { id: 'cold', tr: 'Soğuk Mezeler', en: 'Cold Appetizers' },
  { id: 'salad', tr: 'Salatalar', en: 'Salads' },
  { id: 'meat', tr: 'Et & Tavuk', en: 'Meat & Chicken' },
  { id: 'dessert', tr: 'Tatlılar', en: 'Desserts' },
  { id: 'drink', tr: 'İçecekler', en: 'Beverages' },
];

const FISH = { tr: ['Balık'], en: ['Fish'] };
const SHELL = { tr: ['Kabuklu deniz ürünleri'], en: ['Shellfish'] };
const DAIRY = { tr: ['Süt'], en: ['Dairy'] };
const GLUTEN = { tr: ['Glüten'], en: ['Gluten'] };
const NONE = { tr: [], en: [] };

export const ITEMS = [
  // ===================== BALIK =====================
  {
    id: 'levrek', cat: 'fish', price: 650, portion: '350 gr', kcal: 320, diet: ['gf'], popular: true,
    name: { tr: 'Izgara Levrek', en: 'Grilled Sea Bass' },
    desc: { tr: 'Günlük taze levrek, kömür ızgarada.', en: 'Daily-fresh sea bass over charcoal.' },
    ing: { tr: ['Levrek', 'Zeytinyağı', 'Limon', 'Deniz tuzu'], en: ['Sea bass', 'Olive oil', 'Lemon', 'Sea salt'] },
    alg: FISH,
  },
  {
    id: 'cipura', cat: 'fish', price: 625, portion: '350 gr', kcal: 300, diet: ['gf'], popular: true,
    name: { tr: 'Çupra', en: 'Sea Bream' },
    desc: { tr: 'Kömür ızgara çupra, zeytinyağı ve limon ile.', en: 'Charcoal-grilled sea bream with olive oil and lemon.' },
    ing: { tr: ['Çupra', 'Zeytinyağı', 'Limon', 'Kekik'], en: ['Sea bream', 'Olive oil', 'Lemon', 'Thyme'] },
    alg: FISH,
  },
  {
    id: 'lufer', cat: 'fish', price: 1250, portion: '350 gr', kcal: 380, diet: ['gf'],
    name: { tr: 'Lüfer', en: 'Bluefish' },
    desc: { tr: 'Boğaz’ın mevsimlik lüferi, ızgara veya tavada.', en: 'Seasonal Bosphorus bluefish, grilled or pan-fried.' },
    ing: { tr: ['Lüfer', 'Zeytinyağı', 'Limon', 'Soğan'], en: ['Bluefish', 'Olive oil', 'Lemon', 'Onion'] },
    alg: FISH,
  },
  {
    id: 'cinekop', cat: 'fish', price: 1000, portion: '300 gr', kcal: 320, diet: ['gf'],
    name: { tr: 'Çinekop', en: 'Small Bluefish' },
    desc: { tr: 'Genç lüfer, ızgara veya tavada.', en: 'Young bluefish, grilled or pan-fried.' },
    ing: { tr: ['Çinekop', 'Zeytinyağı', 'Limon'], en: ['Small bluefish', 'Olive oil', 'Lemon'] },
    alg: FISH,
  },
  {
    id: 'mezgit', cat: 'fish', price: 550, portion: '350 gr', kcal: 240, diet: ['gf'],
    name: { tr: 'Mezgit', en: 'Whiting' },
    desc: { tr: 'Karadeniz mezgiti, tavada.', en: 'Black Sea whiting, pan-fried.' },
    ing: { tr: ['Mezgit', 'Mısır unu', 'Zeytinyağı', 'Limon'], en: ['Whiting', 'Cornmeal', 'Olive oil', 'Lemon'] },
    alg: FISH,
  },
  {
    id: 'barbunya', cat: 'fish', price: 1000, portion: '350 gr', kcal: 300, diet: ['gf'],
    name: { tr: 'Barbunya', en: 'Red Mullet' },
    desc: { tr: 'Kızarmış barbunya, kömür ızgarada.', en: 'Pan-seared red mullet over charcoal.' },
    ing: { tr: ['Barbunya', 'Zeytinyağı', 'Limon', 'Deniz tuzu'], en: ['Red mullet', 'Olive oil', 'Lemon', 'Sea salt'] },
    alg: FISH,
  },
  {
    id: 'tekir', cat: 'fish', price: 850, portion: '300 gr', kcal: 290, diet: ['gf'],
    name: { tr: 'Tekir', en: 'Striped Red Mullet' },
    desc: { tr: 'Taze tekir, tavada kızarmış.', en: 'Fresh striped mullet, pan-fried.' },
    ing: { tr: ['Tekir', 'Zeytinyağı', 'Limon'], en: ['Striped mullet', 'Olive oil', 'Lemon'] },
    alg: FISH,
  },
  {
    id: 'istavrit', cat: 'fish', price: 550, portion: '300 gr', kcal: 280, diet: ['gf'],
    name: { tr: 'İstavrit', en: 'Horse Mackerel' },
    desc: { tr: 'Boğaz istavriti, ızgara veya tavada.', en: 'Bosphorus horse mackerel, grilled or fried.' },
    ing: { tr: ['İstavrit', 'Zeytinyağı', 'Limon'], en: ['Horse mackerel', 'Olive oil', 'Lemon'] },
    alg: FISH,
  },
  {
    id: 'hamsi', cat: 'fish', price: 550, portion: '300 gr', kcal: 300, diet: ['gf'],
    name: { tr: 'Hamsi', en: 'Anchovy' },
    desc: { tr: 'Karadeniz hamsisi, mısır unu ile tavada.', en: 'Black Sea anchovy, pan-fried in cornmeal.' },
    ing: { tr: ['Hamsi', 'Mısır unu', 'Zeytinyağı'], en: ['Anchovy', 'Cornmeal', 'Olive oil'] },
    alg: FISH,
  },
  {
    id: 'palamut', cat: 'fish', price: null, portion: '300 gr', kcal: 350, diet: ['gf'],
    name: { tr: 'Palamut', en: 'Bonito' },
    desc: { tr: 'Mevsiminde palamut, ızgarada.', en: 'Seasonal bonito, grilled.' },
    ing: { tr: ['Palamut', 'Zeytinyağı', 'Soğan', 'Limon'], en: ['Bonito', 'Olive oil', 'Onion', 'Lemon'] },
    alg: FISH,
  },
  {
    id: 'kalkan', cat: 'fish', price: null, portion: '250 gr', kcal: 260, diet: ['gf'],
    name: { tr: 'Kalkan', en: 'Turbot' },
    desc: { tr: 'Mevsiminde Karadeniz kalkanı, tereyağında.', en: 'Seasonal Black Sea turbot, pan-finished in butter.' },
    ing: { tr: ['Kalkan', 'Tereyağı', 'Limon', 'Maydanoz'], en: ['Turbot', 'Butter', 'Lemon', 'Parsley'] },
    alg: { tr: ['Balık', 'Süt'], en: ['Fish', 'Dairy'] },
  },
  {
    id: 'iskorpit', cat: 'fish', price: 750, portion: '300 gr', kcal: 340, diet: ['gf'],
    name: { tr: 'İskorpit Güveç', en: 'Scorpion Fish Casserole' },
    desc: { tr: 'İskorpit balığı, domates soslu fırın güveç.', en: 'Scorpion fish baked in a tomato casserole.' },
    ing: { tr: ['İskorpit', 'Domates', 'Sarımsak', 'Zeytinyağı'], en: ['Scorpion fish', 'Tomato', 'Garlic', 'Olive oil'] },
    alg: FISH,
  },
  {
    id: 'dilsis', cat: 'fish', price: 550, portion: '300 gr', kcal: 300, diet: ['gf'],
    name: { tr: 'Dil Şiş', en: 'Fluke Skewers' },
    desc: { tr: 'Dil balığı şişte, kömür ızgarada.', en: 'Fluke fillet skewers over charcoal.' },
    ing: { tr: ['Dil balığı', 'Zeytinyağı', 'Limon', 'Defne'], en: ['Fluke', 'Olive oil', 'Lemon', 'Bay leaf'] },
    alg: FISH,
  },
  {
    id: 'kilicsis', cat: 'fish', price: 700, portion: '350 gr', kcal: 330, diet: ['gf'],
    name: { tr: 'Kılıç Şiş', en: 'Swordfish Skewers' },
    desc: { tr: 'Kılıç balığı şişte, domates ve defne ile.', en: 'Swordfish skewers with tomato and bay leaf.' },
    ing: { tr: ['Kılıç balığı', 'Domates', 'Defne', 'Zeytinyağı'], en: ['Swordfish', 'Tomato', 'Bay leaf', 'Olive oil'] },
    alg: FISH,
  },
  {
    id: 'fenersis', cat: 'fish', price: 600, portion: '300 gr', kcal: 320, diet: ['gf'],
    name: { tr: 'Fener Şiş ve Kavurma', en: 'Monkfish Skewers & Sauté' },
    desc: { tr: 'Fener (deniz şeytanı) balığı, şişte ve kavurma.', en: 'Monkfish, grilled on skewers or sautéed.' },
    ing: { tr: ['Fener balığı', 'Zeytinyağı', 'Sarımsak', 'Biber'], en: ['Monkfish', 'Olive oil', 'Garlic', 'Pepper'] },
    alg: FISH,
  },
  {
    id: 'tuzdalevrek', cat: 'fish', price: null, portion: null, kcal: 400, diet: ['gf'], chef: true,
    name: { tr: 'Tuzda Levrek', en: 'Salt-Baked Sea Bass' },
    desc: { tr: 'Tuz kabuğunda pişirilen bütün levrek, masada servis.', en: 'Whole sea bass baked in a salt crust, carved tableside.' },
    ing: { tr: ['Levrek', 'Deniz tuzu', 'Yumurta akı', 'Kekik', 'Limon'], en: ['Sea bass', 'Sea salt', 'Egg white', 'Thyme', 'Lemon'] },
    alg: { tr: ['Balık', 'Yumurta'], en: ['Fish', 'Egg'] },
  },
  {
    id: 'dil', cat: 'fish', price: 820, portion: null, kcal: 350, diet: ['gf'], chef: true,
    name: { tr: 'Dil Balığı', en: 'Dover Sole' },
    desc: { tr: 'Tereyağı ve limon soslu fırın dil balığı.', en: 'Oven-baked sole in a butter and lemon sauce.' },
    ing: { tr: ['Dil balığı', 'Tereyağı', 'Limon', 'Kapari'], en: ['Sole', 'Butter', 'Lemon', 'Capers'] },
    alg: { tr: ['Balık', 'Süt'], en: ['Fish', 'Dairy'] },
  },

  // ===================== ARA SICAKLAR =====================
  {
    id: 'baliksorbasi', cat: 'hot', price: 350, portion: '250 gr', kcal: 180, diet: ['gf'],
    name: { tr: 'Balık Çorbası', en: 'Fish Soup' },
    desc: { tr: 'Terbiyeli balık çorbası, limon ile.', en: 'Creamy fish soup finished with lemon.' },
    ing: { tr: ['Balık suyu', 'Yumurta', 'Un', 'Limon'], en: ['Fish stock', 'Egg', 'Flour', 'Lemon'] },
    alg: { tr: ['Balık', 'Yumurta', 'Glüten'], en: ['Fish', 'Egg', 'Gluten'] },
  },
  {
    id: 'jumbokarides', cat: 'hot', price: 600, portion: '200 gr', kcal: 260, diet: ['gf'], popular: true,
    name: { tr: 'Jumbo Karides', en: 'Jumbo Shrimp' },
    desc: { tr: 'İri karidesler, sarımsaklı tereyağında.', en: 'Large shrimp in garlic butter.' },
    ing: { tr: ['Karides', 'Tereyağı', 'Sarımsak', 'Limon'], en: ['Shrimp', 'Butter', 'Garlic', 'Lemon'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Süt'], en: ['Shellfish', 'Dairy'] },
  },
  {
    id: 'karides', cat: 'hot', price: 700, portion: '200 gr', kcal: 380, diet: ['gf'], chef: true,
    name: { tr: 'Karides Güveç', en: 'Shrimp Casserole' },
    desc: { tr: 'Domates, sarımsak ve kaşar ile fırınlanmış karides.', en: 'Shrimp baked with tomato, garlic and cheese.' },
    ing: { tr: ['Karides', 'Domates', 'Sarımsak', 'Kaşar', 'Yeşil biber'], en: ['Shrimp', 'Tomato', 'Garlic', 'Cheese', 'Green pepper'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Süt'], en: ['Shellfish', 'Dairy'] },
  },
  {
    id: 'tereyagkarides', cat: 'hot', price: 700, portion: '200 gr', kcal: 420, diet: ['gf'],
    name: { tr: 'Tereyağında Karides', en: 'Butter Shrimp' },
    desc: { tr: 'Bol tereyağı ve sarımsakta sote karides.', en: 'Shrimp sautéed in butter and garlic.' },
    ing: { tr: ['Karides', 'Tereyağı', 'Sarımsak', 'Maydanoz'], en: ['Shrimp', 'Butter', 'Garlic', 'Parsley'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Süt'], en: ['Shellfish', 'Dairy'] },
  },
  {
    id: 'guvec', cat: 'hot', price: 700, portion: '200 gr', kcal: 460, diet: ['gf'], chef: true, popular: true,
    name: { tr: 'Deniz Ürünleri Güveç', en: 'Seafood Casserole' },
    desc: { tr: 'Karides, midye, kalamar; domates soslu fırın güveç.', en: 'Shrimp, mussels and calamari in a baked tomato casserole.' },
    ing: { tr: ['Karides', 'Midye', 'Kalamar', 'Domates', 'Sarımsak'], en: ['Shrimp', 'Mussels', 'Calamari', 'Tomato', 'Garlic'] },
    alg: SHELL,
  },
  {
    id: 'kalamar', cat: 'hot', price: 700, portion: '200 gr', kcal: 450, diet: [], popular: true,
    name: { tr: 'Kalamar Tava', en: 'Fried Calamari' },
    desc: { tr: 'Çıtır kalamar halkaları, tarator sos eşliğinde.', en: 'Crispy calamari rings served with tartar sauce.' },
    ing: { tr: ['Kalamar', 'Un', 'Mısır unu', 'Tarator', 'Limon'], en: ['Calamari', 'Flour', 'Cornmeal', 'Tartar', 'Lemon'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Glüten', 'Yumurta'], en: ['Shellfish', 'Gluten', 'Egg'] },
  },
  {
    id: 'midyetava', cat: 'hot', price: 375, portion: null, kcal: 350, diet: [],
    name: { tr: 'Midye Tava', en: 'Fried Mussels' },
    desc: { tr: 'Çıtır kızarmış midye, tarator ile.', en: 'Crispy fried mussels with tartar sauce.' },
    ing: { tr: ['Midye', 'Un', 'Bira', 'Tarator'], en: ['Mussels', 'Flour', 'Beer', 'Tartar'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Glüten'], en: ['Shellfish', 'Gluten'] },
  },
  {
    id: 'midyeizgara', cat: 'hot', price: 425, portion: null, kcal: 220, diet: ['gf'],
    name: { tr: 'Midye Izgara', en: 'Grilled Mussels' },
    desc: { tr: 'Kabuğunda ızgara midye, tereyağı ve limon ile.', en: 'Mussels grilled on the half-shell with butter and lemon.' },
    ing: { tr: ['Midye', 'Tereyağı', 'Sarımsak', 'Limon'], en: ['Mussels', 'Butter', 'Garlic', 'Lemon'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Süt'], en: ['Shellfish', 'Dairy'] },
  },
  {
    id: 'sigaraboregi', cat: 'hot', price: 300, portion: null, kcal: 300, diet: ['veg'],
    name: { tr: 'Sigara Böreği', en: 'Cheese Rolls' },
    desc: { tr: 'Çıtır yufka içinde peynir, kızarmış.', en: 'Crispy filo rolls filled with cheese.' },
    ing: { tr: ['Yufka', 'Beyaz peynir', 'Maydanoz'], en: ['Filo pastry', 'White cheese', 'Parsley'] },
    alg: { tr: ['Glüten', 'Süt'], en: ['Gluten', 'Dairy'] },
  },
  {
    id: 'balikboregi', cat: 'hot', price: 400, portion: null, kcal: 320, diet: [],
    name: { tr: 'Balık Böreği', en: 'Fish Rolls' },
    desc: { tr: 'Çıtır yufka içinde balık, kızarmış.', en: 'Crispy filo rolls with a fish filling.' },
    ing: { tr: ['Yufka', 'Balık', 'Baharat'], en: ['Filo pastry', 'Fish', 'Spices'] },
    alg: { tr: ['Glüten', 'Balık'], en: ['Gluten', 'Fish'] },
  },
  {
    id: 'balikkoftesi', cat: 'hot', price: 550, portion: '200 gr', kcal: 330, diet: [],
    name: { tr: 'Balık Köftesi', en: 'Fish Cakes' },
    desc: { tr: 'Baharatlı balık köftesi, kızarmış.', en: 'Spiced fish cakes, pan-fried.' },
    ing: { tr: ['Balık', 'Galeta unu', 'Yumurta', 'Baharat'], en: ['Fish', 'Breadcrumbs', 'Egg', 'Spices'] },
    alg: { tr: ['Balık', 'Glüten', 'Yumurta'], en: ['Fish', 'Gluten', 'Egg'] },
  },
  {
    id: 'balikkokorec', cat: 'hot', price: 700, portion: '200 gr', kcal: 380, diet: [],
    name: { tr: 'Balık Kokoreç', en: 'Fish Kokoreç' },
    desc: { tr: 'Baharatlı balık kokoreç, domates ve biber ile.', en: 'Spiced fish "kokoreç" with tomato and pepper.' },
    ing: { tr: ['Balık', 'Domates', 'Biber', 'Kekik'], en: ['Fish', 'Tomato', 'Pepper', 'Oregano'] },
    alg: FISH,
  },
  {
    id: 'patatestava', cat: 'hot', price: 300, portion: '200 gr', kcal: 350, diet: ['gf', 'veg'],
    name: { tr: 'Patates Tava', en: 'Fried Potatoes' },
    desc: { tr: 'Çıtır kızarmış patates.', en: 'Crispy fried potatoes.' },
    ing: { tr: ['Patates', 'Ayçiçek yağı', 'Tuz'], en: ['Potato', 'Sunflower oil', 'Salt'] },
    alg: NONE,
  },
  {
    id: 'patlicansoslu', cat: 'hot', price: 300, portion: null, kcal: 220, diet: ['gf', 'veg'],
    name: { tr: 'Patlıcan Soslu', en: 'Eggplant in Sauce' },
    desc: { tr: 'Kızarmış patlıcan, domates soslu.', en: 'Fried eggplant in a tomato sauce.' },
    ing: { tr: ['Patlıcan', 'Domates', 'Sarımsak', 'Zeytinyağı'], en: ['Eggplant', 'Tomato', 'Garlic', 'Olive oil'] },
    alg: NONE,
  },

  // ===================== SOĞUK MEZELER =====================
  {
    id: 'fava', cat: 'cold', price: 300, portion: null, kcal: 180, diet: ['gf', 'veg'], popular: true,
    name: { tr: 'Fava', en: 'Broad Bean Purée' },
    desc: { tr: 'Zeytinyağlı fava, dereotu ve limon ile.', en: 'Olive-oil broad bean purée with dill and lemon.' },
    ing: { tr: ['Bakla', 'Soğan', 'Dereotu', 'Zeytinyağı', 'Limon'], en: ['Broad beans', 'Onion', 'Dill', 'Olive oil', 'Lemon'] },
    alg: NONE,
  },
  {
    id: 'haydari', cat: 'cold', price: 300, portion: null, kcal: 160, diet: ['gf', 'veg'],
    name: { tr: 'Haydari', en: 'Garlic Yoghurt Dip' },
    desc: { tr: 'Sarımsaklı süzme yoğurt, dereotu ile.', en: 'Thick yoghurt with garlic and dill.' },
    ing: { tr: ['Süzme yoğurt', 'Sarımsak', 'Dereotu', 'Ceviz'], en: ['Strained yoghurt', 'Garlic', 'Dill', 'Walnut'] },
    alg: { tr: ['Süt', 'Sert kabuklu yemiş'], en: ['Dairy', 'Tree nuts'] },
  },
  {
    id: 'aciliezme', cat: 'cold', price: 300, portion: null, kcal: 120, diet: ['gf', 'veg'],
    name: { tr: 'Acılı Ezme', en: 'Spicy Paste' },
    desc: { tr: 'Domates, biber ve baharatlarla acılı ezme.', en: 'Spicy chopped tomato and pepper relish.' },
    ing: { tr: ['Domates', 'Biber', 'Soğan', 'Nar ekşisi'], en: ['Tomato', 'Pepper', 'Onion', 'Pomegranate molasses'] },
    alg: NONE,
  },
  {
    id: 'patlicansalatasi', cat: 'cold', price: 300, portion: null, kcal: 180, diet: ['gf', 'veg'],
    name: { tr: 'Patlıcan Salatası', en: 'Smoked Eggplant Salad' },
    desc: { tr: 'Közlenmiş patlıcan, zeytinyağı ve sarımsak ile.', en: 'Char-grilled eggplant with olive oil and garlic.' },
    ing: { tr: ['Patlıcan', 'Zeytinyağı', 'Sarımsak', 'Limon'], en: ['Eggplant', 'Olive oil', 'Garlic', 'Lemon'] },
    alg: NONE,
  },
  {
    id: 'semizotu', cat: 'cold', price: 300, portion: null, kcal: 110, diet: ['gf', 'veg'],
    name: { tr: 'Semizotu', en: 'Purslane with Yoghurt' },
    desc: { tr: 'Yoğurtlu semizotu, sarımsak ile.', en: 'Purslane in garlic yoghurt.' },
    ing: { tr: ['Semizotu', 'Yoğurt', 'Sarımsak'], en: ['Purslane', 'Yoghurt', 'Garlic'] },
    alg: DAIRY,
  },
  {
    id: 'denizborulcesi', cat: 'cold', price: 300, portion: null, kcal: 90, diet: ['gf', 'veg'],
    name: { tr: 'Deniz Börülcesi', en: 'Samphire' },
    desc: { tr: 'Haşlanmış deniz börülcesi, zeytinyağı ve limon ile.', en: 'Blanched samphire (glasswort) with olive oil and lemon.' },
    ing: { tr: ['Deniz börülcesi', 'Zeytinyağı', 'Sarımsak', 'Limon'], en: ['Samphire', 'Olive oil', 'Garlic', 'Lemon'] },
    alg: NONE,
  },
  {
    id: 'pazikavurma', cat: 'cold', price: 300, portion: null, kcal: 130, diet: ['gf', 'veg'],
    name: { tr: 'Pazı Kavurma', en: 'Sautéed Chard' },
    desc: { tr: 'Zeytinyağında kavrulmuş pazı.', en: 'Chard sautéed in olive oil.' },
    ing: { tr: ['Pazı', 'Zeytinyağı', 'Soğan'], en: ['Chard', 'Olive oil', 'Onion'] },
    alg: NONE,
  },
  {
    id: 'pancar', cat: 'cold', price: 300, portion: null, kcal: 120, diet: ['gf', 'veg'],
    name: { tr: 'Pancar', en: 'Beetroot' },
    desc: { tr: 'Yoğurtlu közlenmiş pancar.', en: 'Roasted beetroot with yoghurt.' },
    ing: { tr: ['Pancar', 'Yoğurt', 'Sarımsak'], en: ['Beetroot', 'Yoghurt', 'Garlic'] },
    alg: DAIRY,
  },
  {
    id: 'pilaki', cat: 'cold', price: 300, portion: null, kcal: 220, diet: ['gf', 'veg'],
    name: { tr: 'Pilaki', en: 'Bean Pilaki' },
    desc: { tr: 'Zeytinyağlı kuru fasulye pilaki, soğuk servis.', en: 'Cold white bean stew in olive oil.' },
    ing: { tr: ['Kuru fasulye', 'Havuç', 'Patates', 'Zeytinyağı'], en: ['White beans', 'Carrot', 'Potato', 'Olive oil'] },
    alg: NONE,
  },
  {
    id: 'kisir', cat: 'cold', price: 300, portion: null, kcal: 200, diet: ['veg'],
    name: { tr: 'Kısır', en: 'Bulgur Salad' },
    desc: { tr: 'İnce bulgur, domates ve nar ekşisi ile.', en: 'Fine bulgur with tomato and pomegranate molasses.' },
    ing: { tr: ['Bulgur', 'Domates', 'Maydanoz', 'Nar ekşisi'], en: ['Bulgur', 'Tomato', 'Parsley', 'Pomegranate molasses'] },
    alg: GLUTEN,
  },
  {
    id: 'beyazpeynir', cat: 'cold', price: 150, portion: null, kcal: 250, diet: ['gf', 'veg'],
    name: { tr: 'Beyaz Peynir', en: 'White Cheese' },
    desc: { tr: 'Tam yağlı beyaz peynir, kavun mevsiminde ikram.', en: 'Full-fat white cheese, a rakı classic.' },
    ing: { tr: ['Beyaz peynir'], en: ['White cheese'] },
    alg: DAIRY,
  },
  {
    id: 'levrekmarin', cat: 'cold', price: 475, portion: null, kcal: 180, diet: ['gf'], chef: true,
    name: { tr: 'Levrek Marin', en: 'Marinated Sea Bass' },
    desc: { tr: 'İnce dilimlenmiş levrek, narenciye ve pembe biber.', en: 'Thin-sliced sea bass with citrus and pink pepper.' },
    ing: { tr: ['Levrek', 'Limon', 'Portakal', 'Pembe biber', 'Zeytinyağı'], en: ['Sea bass', 'Lemon', 'Orange', 'Pink pepper', 'Olive oil'] },
    alg: FISH,
  },
  {
    id: 'lakerda', cat: 'cold', price: 500, portion: null, kcal: 280, diet: ['gf'],
    name: { tr: 'Lakerda', en: 'Salt-Cured Bonito' },
    desc: { tr: 'Tuzda olgunlaştırılmış palamut, soğan ile.', en: 'Salt-cured bonito served with onion.' },
    ing: { tr: ['Palamut', 'Deniz tuzu', 'Soğan', 'Zeytinyağı'], en: ['Bonito', 'Sea salt', 'Onion', 'Olive oil'] },
    alg: FISH,
  },
  {
    id: 'ciroz', cat: 'cold', price: 450, portion: null, kcal: 250, diet: ['gf'],
    name: { tr: 'Çiroz', en: 'Dried Mackerel' },
    desc: { tr: 'Kurutulmuş uskumru, zeytinyağı ve limon ile.', en: 'Sun-dried mackerel with olive oil and lemon.' },
    ing: { tr: ['Uskumru', 'Zeytinyağı', 'Limon', 'Sarımsak'], en: ['Mackerel', 'Olive oil', 'Lemon', 'Garlic'] },
    alg: FISH,
  },
  {
    id: 'karidessogus', cat: 'cold', price: 575, portion: null, kcal: 200, diet: ['gf'],
    name: { tr: 'Karides Söğüş', en: 'Poached Shrimp' },
    desc: { tr: 'Haşlanmış karides, soğuk; limon ve marul ile.', en: 'Chilled poached shrimp with lemon and lettuce.' },
    ing: { tr: ['Karides', 'Marul', 'Limon', 'Zeytinyağı'], en: ['Shrimp', 'Lettuce', 'Lemon', 'Olive oil'] },
    alg: SHELL,
  },
  {
    id: 'ahtapot', cat: 'cold', price: 650, portion: null, kcal: 220, diet: ['gf'],
    name: { tr: 'Ahtapot Salatası', en: 'Octopus Salad' },
    desc: { tr: 'Közlenmiş ahtapot, kapari ve zeytinyağı.', en: 'Grilled octopus with capers and olive oil.' },
    ing: { tr: ['Ahtapot', 'Kapari', 'Kırmızı soğan', 'Zeytinyağı', 'Maydanoz'], en: ['Octopus', 'Capers', 'Red onion', 'Olive oil', 'Parsley'] },
    alg: SHELL,
  },
  {
    id: 'midye', cat: 'cold', price: 350, portion: null, kcal: 280, diet: [],
    name: { tr: 'Midye Dolma', en: 'Stuffed Mussels' },
    desc: { tr: 'Baharatlı iç pilav ile doldurulmuş taze midye.', en: 'Fresh mussels filled with spiced rice pilaf.' },
    ing: { tr: ['Midye', 'Pirinç', 'Kuş üzümü', 'Çam fıstığı', 'Baharat'], en: ['Mussels', 'Rice', 'Currants', 'Pine nuts', 'Spices'] },
    alg: { tr: ['Kabuklu deniz ürünleri', 'Sert kabuklu yemiş'], en: ['Shellfish', 'Tree nuts'] },
  },

  // ===================== SALATALAR =====================
  {
    id: 'cobansalata', cat: 'salad', price: 180, portion: null, kcal: 120, diet: ['gf', 'veg'],
    name: { tr: 'Çoban Salata', en: "Shepherd's Salad" },
    desc: { tr: 'Domates, salatalık, biber ve soğan.', en: 'Diced tomato, cucumber, pepper and onion.' },
    ing: { tr: ['Domates', 'Salatalık', 'Biber', 'Soğan'], en: ['Tomato', 'Cucumber', 'Pepper', 'Onion'] },
    alg: NONE,
  },
  {
    id: 'mevsim', cat: 'salad', price: 180, portion: null, kcal: 120, diet: ['gf', 'veg'],
    name: { tr: 'Mevsim Salata', en: 'Season Salad' },
    desc: { tr: 'Taze mevsim yeşillikleri, nar ekşili sos ile.', en: 'Crisp seasonal greens with pomegranate dressing.' },
    ing: { tr: ['Marul', 'Roka', 'Domates', 'Salatalık', 'Nar ekşisi'], en: ['Lettuce', 'Rocket', 'Tomato', 'Cucumber', 'Pomegranate'] },
    alg: NONE,
  },
  {
    id: 'roka', cat: 'salad', price: 180, portion: null, kcal: 150, diet: ['gf', 'veg'],
    name: { tr: 'Roka Salatası', en: 'Rocket Salad' },
    desc: { tr: 'Taze roka, parmesan ve balzamik glaze.', en: 'Fresh rocket with parmesan and balsamic glaze.' },
    ing: { tr: ['Roka', 'Parmesan', 'Balzamik', 'Zeytinyağı'], en: ['Rocket', 'Parmesan', 'Balsamic', 'Olive oil'] },
    alg: DAIRY,
  },

  // ===================== ET & TAVUK =====================
  {
    id: 'etsis', cat: 'meat', price: 950, portion: '200 gr', kcal: 450, diet: ['gf'],
    name: { tr: 'Et Şiş', en: 'Meat Skewers' },
    desc: { tr: 'Marine dana şiş, kömür ızgarada.', en: 'Marinated beef skewers over charcoal.' },
    ing: { tr: ['Dana eti', 'Soğan', 'Biber', 'Baharat'], en: ['Beef', 'Onion', 'Pepper', 'Spices'] },
    alg: NONE,
  },
  {
    id: 'kofte', cat: 'meat', price: 600, portion: '250 gr', kcal: 420, diet: [],
    name: { tr: 'Köfte', en: 'Grilled Meatballs' },
    desc: { tr: 'Izgara köfte, baharatlı.', en: 'Char-grilled spiced meatballs.' },
    ing: { tr: ['Dana kıyma', 'Soğan', 'Galeta unu', 'Baharat'], en: ['Ground beef', 'Onion', 'Breadcrumbs', 'Spices'] },
    alg: GLUTEN,
  },
  {
    id: 'tavukizgara', cat: 'meat', price: 550, portion: '250 gr', kcal: 380, diet: ['gf'],
    name: { tr: 'Tavuk Izgara', en: 'Grilled Chicken' },
    desc: { tr: 'Marine tavuk göğsü, kömür ızgarada.', en: 'Marinated chicken breast over charcoal.' },
    ing: { tr: ['Tavuk göğsü', 'Zeytinyağı', 'Kekik', 'Limon'], en: ['Chicken breast', 'Olive oil', 'Thyme', 'Lemon'] },
    alg: NONE,
  },

  // ===================== TATLILAR =====================
  {
    id: 'baklava', cat: 'dessert', price: 400, portion: null, kcal: 430, diet: ['veg'],
    name: { tr: 'Baklava', en: 'Baklava' },
    desc: { tr: 'Antep fıstıklı baklava, şerbetli.', en: 'Pistachio baklava in syrup.' },
    ing: { tr: ['Yufka', 'Antep fıstığı', 'Tereyağı', 'Şerbet'], en: ['Filo pastry', 'Pistachio', 'Butter', 'Syrup'] },
    alg: { tr: ['Glüten', 'Sert kabuklu yemiş', 'Süt'], en: ['Gluten', 'Tree nuts', 'Dairy'] },
  },
  {
    id: 'kunefe', cat: 'dessert', price: 240, portion: null, kcal: 450, diet: ['veg'], popular: true,
    name: { tr: 'Künefe', en: 'Künefe' },
    desc: { tr: 'Sıcak künefe, fıstık ve şerbet ile.', en: 'Warm shredded-pastry künefe with pistachio and syrup.' },
    ing: { tr: ['Kadayıf', 'Peynir', 'Şerbet', 'Antep fıstığı'], en: ['Shredded pastry', 'Cheese', 'Syrup', 'Pistachio'] },
    alg: { tr: ['Süt', 'Glüten', 'Sert kabuklu yemiş'], en: ['Dairy', 'Gluten', 'Tree nuts'] },
  },
  {
    id: 'kadayif', cat: 'dessert', price: 350, portion: null, kcal: 420, diet: ['veg'],
    name: { tr: 'Kadayıf', en: 'Kadayıf' },
    desc: { tr: 'Tel kadayıf, fıstık ve şerbet ile.', en: 'Shredded-wheat kadayıf with pistachio and syrup.' },
    ing: { tr: ['Tel kadayıf', 'Antep fıstığı', 'Tereyağı', 'Şerbet'], en: ['Shredded wheat', 'Pistachio', 'Butter', 'Syrup'] },
    alg: { tr: ['Glüten', 'Sert kabuklu yemiş', 'Süt'], en: ['Gluten', 'Tree nuts', 'Dairy'] },
  },
  {
    id: 'kabaktatlisi', cat: 'dessert', price: 350, portion: null, kcal: 300, diet: ['gf', 'veg'],
    name: { tr: 'Kabak Tatlısı', en: 'Pumpkin Dessert' },
    desc: { tr: 'Şerbetli kabak tatlısı, ceviz ve tahin ile.', en: 'Candied pumpkin with walnut and tahini.' },
    ing: { tr: ['Balkabağı', 'Şeker', 'Ceviz', 'Tahin'], en: ['Pumpkin', 'Sugar', 'Walnut', 'Tahini'] },
    alg: { tr: ['Sert kabuklu yemiş', 'Susam'], en: ['Tree nuts', 'Sesame'] },
  },
  {
    id: 'ayva', cat: 'dessert', price: 350, portion: null, kcal: 350, diet: ['gf', 'veg'],
    name: { tr: 'Ayva Tatlısı', en: 'Quince Dessert' },
    desc: { tr: 'Kaymak ile servis edilen fırın ayva tatlısı.', en: 'Slow-baked quince served with clotted cream.' },
    ing: { tr: ['Ayva', 'Şeker', 'Karanfil', 'Kaymak'], en: ['Quince', 'Sugar', 'Clove', 'Clotted cream'] },
    alg: DAIRY,
  },
  {
    id: 'helva', cat: 'dessert', price: 350, portion: null, kcal: 400, diet: ['veg'],
    name: { tr: 'Helva', en: 'Semolina Halva' },
    desc: { tr: 'İrmik helvası, çam fıstığı ile.', en: 'Warm semolina halva with pine nuts.' },
    ing: { tr: ['İrmik', 'Tereyağı', 'Çam fıstığı', 'Şeker'], en: ['Semolina', 'Butter', 'Pine nuts', 'Sugar'] },
    alg: { tr: ['Glüten', 'Süt', 'Sert kabuklu yemiş'], en: ['Gluten', 'Dairy', 'Tree nuts'] },
  },
  {
    id: 'cikolatasufle', cat: 'dessert', price: 350, portion: null, kcal: 480, diet: ['veg'],
    name: { tr: 'Çikolatalı Sufle', en: 'Chocolate Soufflé' },
    desc: { tr: 'Akışkan çikolatalı sufle, dondurma ile.', en: 'Molten chocolate soufflé with ice cream.' },
    ing: { tr: ['Çikolata', 'Tereyağı', 'Yumurta', 'Un'], en: ['Chocolate', 'Butter', 'Egg', 'Flour'] },
    alg: { tr: ['Glüten', 'Süt', 'Yumurta'], en: ['Gluten', 'Dairy', 'Egg'] },
  },
  {
    id: 'krep', cat: 'dessert', price: 550, portion: null, kcal: 420, diet: ['veg'],
    name: { tr: 'Krep', en: 'Pancake' },
    desc: { tr: 'Çikolatalı krep, meyve ile.', en: 'Chocolate crêpe with fresh fruit.' },
    ing: { tr: ['Un', 'Süt', 'Yumurta', 'Çikolata'], en: ['Flour', 'Milk', 'Egg', 'Chocolate'] },
    alg: { tr: ['Glüten', 'Süt', 'Yumurta'], en: ['Gluten', 'Dairy', 'Egg'] },
  },
  {
    id: 'mevsimmeyve', cat: 'dessert', price: 400, portion: null, kcal: 150, diet: ['gf', 'veg'],
    name: { tr: 'Mevsim Meyveleri', en: 'Seasonal Fruits' },
    desc: { tr: 'Mevsimin taze meyveleri tabağı.', en: 'A plate of fresh seasonal fruit.' },
    ing: { tr: ['Mevsim meyveleri'], en: ['Seasonal fruit'] },
    alg: NONE,
  },
  {
    id: 'dondurma', cat: 'dessert', price: 450, portion: null, kcal: 250, diet: ['veg'],
    name: { tr: 'Dondurma', en: 'Ice Cream' },
    desc: { tr: 'Çeşit dondurma topları.', en: 'Assorted ice cream scoops.' },
    ing: { tr: ['Süt', 'Şeker', 'Meyve'], en: ['Milk', 'Sugar', 'Fruit'] },
    alg: DAIRY,
  },

  // ===================== İÇECEKLER =====================
  {
    id: 'raki', cat: 'drink', price: 480, portion: '35 cl', kcal: 800, diet: ['gf', 'veg'], popular: true,
    name: { tr: 'Rakı (35cl)', en: 'Rakı (35cl)' },
    desc: { tr: 'Geleneksel anason aroması, su ve buz ile.', en: 'Traditional anise spirit, served with water and ice.' },
    ing: { tr: ['Anason', 'Üzüm'], en: ['Anise', 'Grape'] },
    alg: NONE,
  },
  {
    id: 'cay', cat: 'drink', price: 60, portion: null, kcal: 2, diet: ['gf', 'veg'],
    name: { tr: 'Türk Çayı', en: 'Turkish Tea' },
    desc: { tr: 'İnce belli bardakta demli Rize çayı.', en: 'Brewed Rize tea in a tulip glass.' },
    ing: { tr: ['Siyah çay'], en: ['Black tea'] },
    alg: NONE,
  },
  {
    id: 'ayran', cat: 'drink', price: 80, portion: null, kcal: 110, diet: ['gf', 'veg'],
    name: { tr: 'Ayran', en: 'Ayran' },
    desc: { tr: 'Ev yapımı tuzlu yoğurt içeceği.', en: 'House-made salted yogurt drink.' },
    ing: { tr: ['Yoğurt', 'Su', 'Tuz'], en: ['Yogurt', 'Water', 'Salt'] },
    alg: DAIRY,
  },
];
