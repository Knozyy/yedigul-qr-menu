import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { UI } from '../data/ui';
import { useMenu } from '../context/MenuContext';
import { getThemeVars } from '../lib/theme';
import { readStorage, writeStorage } from '../lib/storage';
import useScrollSpy from '../lib/useScrollSpy';
import Header from '../components/Header';
import CategoryBar from '../components/CategoryBar';
import SearchFilters from '../components/SearchFilters';
import ProductList from '../components/ProductList';
import MenuSections from '../components/MenuSections';
import BottomSheet from '../components/BottomSheet';

const localize = (field, lang) => (field ? field[lang] : '');

const buildTags = (item, ui) => {
  const tags = [];
  if (item.popular) tags.push({ kind: 'popular', label: ui.popular });
  if (item.chef) tags.push({ kind: 'chef', label: ui.chef });
  return tags;
};

// Varyantlı ürünlerde kart fiyatı aralık olarak gösterilir (120–180 TL);
// varyantı da fiyatı da olmayan ürün "Piyasa Fiyatı" sayılır.
const hasVariants = (it) => (it.variants || []).length > 0;

// para birimi seçili dile göre (TL / ل.ت / ₺)
const priceLabel = (it, ui) => {
  if (hasVariants(it)) {
    const ps = it.variants.map((v) => v.price);
    const min = Math.min(...ps);
    const max = Math.max(...ps);
    return min === max ? `${min} ${ui.currency}` : `${min}–${max} ${ui.currency}`;
  }
  return it.price == null ? ui.market : `${it.price} ${ui.currency}`;
};

const mapItem = (it, lang, ui) => ({
  id: it.id,
  name: localize(it.name, lang),
  desc: localize(it.desc, lang),
  // görselsiz kartın placeholder yazısı seçili dildeki adı gösterir
  // (sunucudaki it.thumb hep İngilizce olduğundan onu kullanmıyoruz)
  thumb: localize(it.name, lang).toUpperCase(),
  image: it.image_url || null,
  isMarket: it.price == null && !hasVariants(it),
  priceText: priceLabel(it, ui),
  kcal: it.kcal ?? null,
  kcalText: it.kcal != null ? `${it.kcal} ${ui.kcalUnit}` : null,
  portion: it.portion ?? null,
  badges: it.diet.map((d) => (d === 'gf' ? ui.gfShort : ui.vegShort)),
  tags: buildTags(it, ui),
});

const passesDiet = (it, gf, veg) => {
  if (gf && !it.diet.includes('gf')) return false;
  if (veg && !it.diet.includes('veg')) return false;
  return true;
};

export default function MenuPage({ defaultLang = 'tr', defaultDark = false, accent = '#C8902F' }) {
  const { categories: CATEGORIES, items: ITEMS, meta, loading } = useMenu();
  const LANGS = ['tr', 'en', 'ar', 'ru'];
  const [lang, setLang] = useState(() => {
    const stored = readStorage('lang', LANGS.includes(defaultLang) ? defaultLang : 'tr');
    return LANGS.includes(stored) ? stored : 'tr';
  });
  const [dark, setDark] = useState(() => readStorage('dark', !!defaultDark));
  const [favorites, setFavorites] = useState(() => readStorage('favorites', []));
  const [search, setSearch] = useState('');
  const [gf, setGf] = useState(false);
  const [veg, setVeg] = useState(false);
  const [favView, setFavView] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [stickyH, setStickyH] = useState(220);
  const [headTop, setHeadTop] = useState(0);
  const [pendingScroll, setPendingScroll] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const stickyRef = useRef(null);
  const headerRef = useRef(null);
  const ui = UI[lang];

  // persist preferences
  useEffect(() => writeStorage('lang', lang), [lang]);
  useEffect(() => writeStorage('dark', dark), [dark]);
  useEffect(() => writeStorage('favorites', favorites), [favorites]);

  // measure sticky header height for scroll-spy offsets
  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-height: 480px)');
    const measure = () => {
      if (!stickyRef.current || !headerRef.current) return;
      const total = stickyRef.current.offsetHeight;
      const header = headerRef.current.offsetHeight;
      // Kısa ekranda (yatay telefon) sticky bloğa negatif top verilir: büyük
      // başlık kaydırınca ekrandan çıkar, kategori çipleri üstte asılı kalır.
      // Scroll-spy/scroll-margin ofseti de asılı kalan kısma göre hesaplanır.
      if (mq.matches) {
        setHeadTop(-header);
        setStickyH(total - header);
      } else {
        setHeadTop(0);
        setStickyH(total);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    mq.addEventListener('change', measure);
    return () => {
      window.removeEventListener('resize', measure);
      mq.removeEventListener('change', measure);
    };
  }, []);

  const toggleFav = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSection = useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandSection = useCallback((id) => {
    setCollapsedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const q = search.trim();
  const mode = q ? 'search' : favView ? 'fav' : 'sections';

  // yalnız (aktif diyet filtresinden geçen) ürünü olan kategoriler çip göstersin;
  // aksi halde boş/filtrelenmiş kategorinin çipine tıklamak ölü tık olurdu
  // (kayacak bölüm yok). Bu, çip listesini görünen bölümlerle tutarlı tutar.
  const categories = useMemo(() => {
    const withItems = new Set(
      ITEMS.filter((it) => passesDiet(it, gf, veg)).map((it) => it.cat)
    );
    return CATEGORIES.filter((c) => withItems.has(c.id)).map((c) => ({ id: c.id, label: localize(c, lang) }));
  }, [CATEGORIES, ITEMS, lang, gf, veg]);

  // stacked sections (normal browsing) — drops categories emptied by filters
  const sections = useMemo(() => {
    return CATEGORIES.map((c) => ({
      id: c.id,
      title: localize(c, lang),
      items: ITEMS.filter((it) => it.cat === c.id && passesDiet(it, gf, veg)).map((it) => mapItem(it, lang, ui)),
    })).filter((s) => s.items.length > 0);
  }, [CATEGORIES, ITEMS, lang, gf, veg, ui]);

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const { active: activeCat, register, scrollTo } = useScrollSpy(
    sectionIds,
    stickyH,
    mode === 'sections'
  );

  // search results (flat, across all categories)
  const searchResults = useMemo(() => {
    if (!q) return [];
    const needle = q.toLowerCase();
    return ITEMS.filter(
      (it) =>
        passesDiet(it, gf, veg) &&
        (localize(it.name, lang).toLowerCase().includes(needle) ||
          localize(it.desc, lang).toLowerCase().includes(needle))
    ).map((it) => mapItem(it, lang, ui));
  }, [ITEMS, q, gf, veg, lang, ui]);

  // favorites (flat)
  const favResults = useMemo(
    () =>
      ITEMS.filter((it) => favorites.includes(it.id) && passesDiet(it, gf, veg)).map((it) =>
        mapItem(it, lang, ui)
      ),
    [ITEMS, favorites, gf, veg, lang, ui]
  );

  const sheet = useMemo(() => {
    if (!selectedId) return null;
    const sel = ITEMS.find((i) => i.id === selectedId);
    if (!sel) return null;
    const selCat = CATEGORIES.find((c) => c.id === sel.cat);
    const allergens = localize(sel.alg, lang);
    return {
      id: sel.id,
      name: localize(sel.name, lang),
      desc: localize(sel.desc, lang),
      thumb: localize(sel.name, lang).toUpperCase(),
      image: sel.image_url || null,
      images: sel.images || [],
      variants: (sel.variants || []).map((v) => ({ name: localize(v.name, lang), price: v.price })),
      category: localize(selCat, lang),
      isMarket: sel.price == null && !hasVariants(sel),
      priceText: priceLabel(sel, ui),
      kcal: sel.kcal ?? null,
      portion: sel.portion ?? null,
      ingredients: localize(sel.ing, lang),
      allergens: allergens && allergens.length ? allergens.join(' · ') : ui.noAlg,
      tags: buildTags(sel, ui),
    };
  }, [ITEMS, CATEGORIES, selectedId, lang, ui]);

  // category chip click — leave search/fav mode then scroll to the section
  const onSelectCategory = useCallback(
    (id) => {
      expandSection(id); // kapalı bölüme kaydırılıyorsa önce aç
      if (q || favView) {
        setSearch('');
        setFavView(false);
        setPendingScroll(id);
      } else {
        scrollTo(id);
      }
    },
    [q, favView, scrollTo, expandSection]
  );

  useEffect(() => {
    if (mode === 'sections' && pendingScroll) {
      scrollTo(pendingScroll);
      setPendingScroll(null);
    }
  }, [mode, pendingScroll, scrollTo]);

  const themeVars = getThemeVars(dark, accent);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1422', color: '#92A3C0' }}>
        {ui.loading}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center font-inter" style={{ background: '#0b1422' }}>
      <div className="w-full max-w-[468px] md:max-w-[1000px]" style={themeVars}>
        <div
          className="w-full max-w-[468px] md:max-w-[1000px] mx-auto min-h-screen flex flex-col relative"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          style={{ background: 'var(--bg)', color: 'var(--text)', boxShadow: '0 0 90px rgba(0,0,0,.55)' }}
        >
          <div ref={stickyRef} className="sticky z-30" style={{ top: headTop }}>
            <div ref={headerRef}>
              <Header
                ui={ui}
                dark={dark}
                onToggleTheme={() => setDark((d) => !d)}
                lang={lang}
                onSetLang={setLang}
                favView={favView}
                favCount={favorites.length}
                onToggleFavView={() => setFavView((v) => !v)}
              />
            </div>
            <CategoryBar
              categories={categories}
              activeCat={mode === 'sections' ? activeCat : null}
              onSelect={onSelectCategory}
            />
          </div>

          {meta.info.wifi && (
            <div
              className="mx-5 mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{ background: 'var(--gold-tint)', borderColor: 'var(--gold-soft)' }}
            >
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none"
              >
                <path d="M5 12.55a11 11 0 0 1 14 0" />
                <path d="M8.5 16.03a6 6 0 0 1 7 0" />
                <path d="M2 8.82a15 15 0 0 1 20 0" />
                <line x1="12" y1="19.5" x2="12.01" y2="19.5" />
              </svg>
              <div className="min-w-0">
                <span className="yg-overline block text-[9.5px]" style={{ color: 'var(--gold)' }}>{ui.wifi}</span>
                <span className="font-outfit text-[17px] font-semibold tracking-wide select-all" style={{ color: 'var(--text)' }}>
                  {meta.info.wifi}
                </span>
              </div>
            </div>
          )}

          {(meta.announcement[lang] || '').trim() !== '' && (
            <div
              className="mx-5 mt-3 flex items-start gap-2.5 px-4 py-3 rounded-2xl border"
              style={{ background: 'var(--gold-tint)', borderColor: 'var(--gold-soft)' }}
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-[2px]"
              >
                <path d="m3 11 18-5v12L3 14v-3z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
              <span className="font-inter text-[13px] leading-[1.5] font-medium" style={{ color: 'var(--text)' }}>
                {meta.announcement[lang]}
              </span>
            </div>
          )}

          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            placeholder={ui.search}
            gf={gf}
            veg={veg}
            onToggleGF={() => setGf((v) => !v)}
            onToggleVeg={() => setVeg((v) => !v)}
            gfLabel={ui.gf}
            vegLabel={ui.veg}
          />

          {mode === 'search' && (
            <ProductList
              items={searchResults}
              emptyLabel={ui.empty}
              onItemClick={setSelectedId}
              favorites={favorites}
              onToggleFav={toggleFav}
            />
          )}

          {mode === 'fav' && (
            <ProductList
              items={favResults}
              title={ui.favorites}
              countLabel={`${favResults.length} ${ui.items}`}
              emptyLabel={ui.noFav}
              onItemClick={setSelectedId}
              favorites={favorites}
              onToggleFav={toggleFav}
            />
          )}

          {mode === 'sections' && (
            <MenuSections
              sections={sections}
              register={register}
              scrollMargin={stickyH}
              countWord={ui.items}
              emptyLabel={ui.empty}
              onItemClick={setSelectedId}
              favorites={favorites}
              onToggleFav={toggleFav}
              collapsedIds={collapsedIds}
              onToggleSection={toggleSection}
            />
          )}

          {(meta.info.phone || meta.info.hours || meta.info.instagram) && (
            <div
              className="mx-5 mb-5 px-4 py-3.5 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {meta.info.hours && (
                <div>
                  <span className="yg-overline block text-[9.5px]" style={{ color: 'var(--gold)' }}>{ui.hours}</span>
                  <span className="font-inter text-[13px] font-medium" style={{ color: 'var(--text)' }}>{meta.info.hours}</span>
                </div>
              )}
              {meta.info.phone && (
                <div>
                  <span className="yg-overline block text-[9.5px]" style={{ color: 'var(--gold)' }}>{ui.phone}</span>
                  <a
                    href={`tel:${meta.info.phone.replace(/\s/g, '')}`}
                    className="font-inter text-[13px] font-medium no-underline"
                    style={{ color: 'var(--text)' }}
                  >
                    {meta.info.phone}
                  </a>
                </div>
              )}
              {meta.info.instagram && (
                <div>
                  <span className="yg-overline block text-[9.5px]" style={{ color: 'var(--gold)' }}>Instagram</span>
                  <span className="font-inter text-[13px] font-medium" style={{ color: 'var(--text)' }}>{meta.info.instagram}</span>
                </div>
              )}
            </div>
          )}

          <div className="px-5 pb-[30px] flex flex-col items-center gap-2">
            <span
              className="flex-none w-8 h-px"
              style={{ background: 'var(--gold-soft)' }}
            />
            <span
              className="font-outfit italic text-[19px] font-medium leading-none"
              style={{ color: 'var(--gold)' }}
            >
              Yedigül
            </span>
            <span
              className="yg-overline text-[9px] opacity-80"
              style={{ color: 'var(--muted)' }}
            >
              {ui.tagline}
            </span>
          </div>

          <BottomSheet
            sheet={sheet}
            ui={ui}
            onClose={() => setSelectedId(null)}
            isFav={selectedId ? favorites.includes(selectedId) : false}
            onToggleFav={toggleFav}
          />
        </div>
      </div>
    </div>
  );
}
