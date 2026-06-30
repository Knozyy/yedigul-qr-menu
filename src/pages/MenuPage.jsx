import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UI } from '../data/menu';
import { useMenu } from '../context/MenuContext';
import { getThemeVars } from '../lib/theme';
import { getTableNumber, readStorage, writeStorage } from '../lib/storage';
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

const mapItem = (it, lang, ui) => ({
  id: it.id,
  name: localize(it.name, lang),
  desc: localize(it.desc, lang),
  thumb: it.thumb,
  image: it.image_url || null,
  isMarket: it.price == null,
  priceText: it.price == null ? ui.market : `${it.price} TL`,
  badges: it.diet.map((d) => (d === 'gf' ? ui.gfShort : ui.vegShort)),
  tags: buildTags(it, ui),
});

const passesDiet = (it, gf, veg) => {
  if (gf && !it.diet.includes('gf')) return false;
  if (veg && !it.diet.includes('veg')) return false;
  return true;
};

export default function MenuPage({ defaultLang = 'tr', defaultDark = false, accent = '#C8902F' }) {
  const { categories: CATEGORIES, items: ITEMS, loading } = useMenu();
  const [lang, setLang] = useState(() => readStorage('lang', defaultLang === 'en' ? 'en' : 'tr'));
  const [dark, setDark] = useState(() => readStorage('dark', !!defaultDark));
  const [favorites, setFavorites] = useState(() => readStorage('favorites', []));
  const [search, setSearch] = useState('');
  const [gf, setGf] = useState(false);
  const [veg, setVeg] = useState(false);
  const [favView, setFavView] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [stickyH, setStickyH] = useState(220);
  const [pendingScroll, setPendingScroll] = useState(null);

  const stickyRef = useRef(null);
  const ui = UI[lang];
  const { id: routeTable } = useParams();
  const tableNumber = useMemo(() => routeTable || getTableNumber(), [routeTable]);

  // persist preferences
  useEffect(() => writeStorage('lang', lang), [lang]);
  useEffect(() => writeStorage('dark', dark), [dark]);
  useEffect(() => writeStorage('favorites', favorites), [favorites]);

  // measure sticky header height for scroll-spy offsets
  useLayoutEffect(() => {
    const measure = () => {
      if (stickyRef.current) setStickyH(stickyRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const toggleFav = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const q = search.trim();
  const mode = q ? 'search' : favView ? 'fav' : 'sections';

  const categories = useMemo(
    () => CATEGORIES.map((c) => ({ id: c.id, label: localize(c, lang) })),
    [CATEGORIES, lang]
  );

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
      thumb: sel.thumb,
      image: sel.image_url || null,
      category: localize(selCat, lang),
      isMarket: sel.price == null,
      priceText: sel.price == null ? ui.market : `${sel.price} TL`,
      ingredients: localize(sel.ing, lang),
      allergens: allergens && allergens.length ? allergens.join(' · ') : ui.noAlg,
      tags: buildTags(sel, ui),
    };
  }, [ITEMS, CATEGORIES, selectedId, lang, ui]);

  // category chip click — leave search/fav mode then scroll to the section
  const onSelectCategory = useCallback(
    (id) => {
      if (q || favView) {
        setSearch('');
        setFavView(false);
        setPendingScroll(id);
      } else {
        scrollTo(id);
      }
    },
    [q, favView, scrollTo]
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
      <div className="w-full max-w-[468px]" style={themeVars}>
        <div
          className="w-full max-w-[468px] mx-auto min-h-screen flex flex-col relative"
          style={{ background: 'var(--bg)', color: 'var(--text)', boxShadow: '0 0 90px rgba(0,0,0,.55)' }}
        >
          <div ref={stickyRef} className="sticky top-0 z-30">
            <Header
              ui={ui}
              dark={dark}
              onToggleTheme={() => setDark((d) => !d)}
              lang={lang}
              onSetLang={setLang}
              tableNumber={tableNumber}
              favView={favView}
              favCount={favorites.length}
              onToggleFavView={() => setFavView((v) => !v)}
            />
            <CategoryBar
              categories={categories}
              activeCat={mode === 'sections' ? activeCat : null}
              onSelect={onSelectCategory}
            />
          </div>

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
            />
          )}

          <div className="px-5 pb-[30px] text-center">
            <span
              className="font-inter text-[10.5px] uppercase tracking-[.18em] opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              Yedigül · {ui.tagline}
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
