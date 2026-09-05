import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { UI, fmtPrice, fmtPriceRange } from '../data/ui';
import { useMenu } from '../context/menu-context.js';
import { getMenuThemeVars } from '../lib/theme';
import { placeholderArt } from '../lib/placeholder';
import { readStorage, writeStorage } from '../lib/storage';
import { trackProductView } from '../lib/track';
import {
  LANGUAGE_CODES,
  foldForSearch,
  formatItemCount,
  getLanguage,
  localize,
} from '../lib/i18n.js';
import useScrollSpy from '../lib/useScrollSpy';
import useRatingCooldown from '../lib/useRatingCooldown';
import Header from '../components/Header';
import CategoryBar from '../components/CategoryBar';
import SearchFilters from '../components/SearchFilters';
import MenuSections from '../components/MenuSections';
import BottomSheet from '../components/BottomSheet';
import ScrollTopButton from '../components/ScrollTopButton';
import RatingPrompt from '../components/RatingPrompt';
import RatingStrip from '../components/RatingStrip';
import RatingFab from '../components/RatingFab';

const hasVariants = (it) => (it.variants || []).length > 0;

const priceLabel = (it, lang, ui) => {
  if (hasVariants(it)) {
    const ps = it.variants.map((v) => v.price);
    return fmtPriceRange(Math.min(...ps), Math.max(...ps), lang);
  }
  return it.price == null ? ui.market : fmtPrice(it.price, lang);
};

const mapItem = (it, lang, ui, dark) => ({
  id: it.id,
  name: localize(it.name, lang),
  desc: localize(it.desc, lang),
  thumb: it.image_url || placeholderArt(it.cat, 'thumb', dark),
  isMarket: it.price == null && !hasVariants(it),
  priceText: priceLabel(it, lang, ui),
  kcalText: it.kcal != null ? `${it.kcal} ${ui.kcalUnit}` : null,
  portion: it.portion ?? null,
  popular: !!it.popular,
  chef: !!it.chef,
  gf: it.diet.includes('gf'),
  veg: it.diet.includes('veg'),
});

const passesDiet = (it, gf, veg) => {
  if (gf && !it.diet.includes('gf')) return false;
  if (veg && !it.diet.includes('veg')) return false;
  return true;
};

export default function MenuPage({ defaultLang = 'tr', defaultDark = false, accent = '#C8902F' }) {
  const { categories: CATEGORIES, items: ITEMS, sets: SETS, meta, loading, error, reload } = useMenu();
  const [lang, setLang] = useState(() => {
    const stored = readStorage('lang', LANGUAGE_CODES.includes(defaultLang) ? defaultLang : 'tr');
    return LANGUAGE_CODES.includes(stored) ? stored : 'tr';
  });
  const [dark, setDark] = useState(() => readStorage('dark', !!defaultDark));
  const [favorites, setFavorites] = useState(() => readStorage('favorites', []));
  const [search, setSearch] = useState('');
  const [gf, setGf] = useState(false);
  const [veg, setVeg] = useState(false);
  const [fav, setFav] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [catbarH, setCatbarH] = useState(64);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const { rated, markRated } = useRatingCooldown();
  const [stripOpen, setStripOpen] = useState(false);

  const catbarRef = useRef(null);
  const ui = UI[lang];
  const language = getLanguage(lang);

  useEffect(() => writeStorage('lang', lang), [lang]);
  useEffect(() => writeStorage('dark', dark), [dark]);
  useEffect(() => writeStorage('favorites', favorites), [favorites]);

  useEffect(() => {
    const root = document.documentElement;
    const previousLang = root.lang;
    const previousDir = root.dir;
    root.lang = lang;
    root.dir = language.dir;
    return () => {
      root.lang = previousLang;
      root.dir = previousDir;
    };
  }, [lang, language.dir]);

  useEffect(() => {
    document.body.style.background = dark ? '#0A1F35' : '#FBF7ED';
    return () => { document.body.style.background = ''; };
  }, [dark]);

  useLayoutEffect(() => {
    const measure = () => {
      if (catbarRef.current) setCatbarH(catbarRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [loading]);

  const toggleFav = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const openItem = useCallback((id) => {
    setSelectedId(id);
    trackProductView(id);
  }, []);

  const toggleSection = useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const q = foldForSearch(search.trim(), lang);

  const urunBolumleri = useMemo(() => {
    const favSet = new Set(favorites);
    return CATEGORIES.filter((c) => c.kind !== 'sets').map((c) => ({
      id: c.id,
      title: localize(c, lang),
      items: ITEMS.filter((it) => {
        if (it.cat !== c.id || !passesDiet(it, gf, veg)) return false;
        if (fav && !favSet.has(it.id)) return false;
        if (!q) return true;
        const hay = foldForSearch(`${localize(it.name, lang)} ${localize(it.desc, lang)}`, lang);
        return hay.includes(q);
      }).map((it) => mapItem(it, lang, ui, dark)),
    })).filter((s) => s.items.length > 0);
  }, [CATEGORIES, ITEMS, lang, ui, dark, gf, veg, fav, favorites, q]);

  const fixMenus = useMemo(
    () => (SETS || []).map((set) => ({
      id: set.id,
      name: localize(set.name, lang),
      desc: localize(set.desc, lang),
      priceText: set.price == null ? '' : fmtPrice(set.price, lang),
      items: (set.items || []).map((item) => ({ qty: item.qty, name: localize(item.name, lang) })),
    })),
    [SETS, lang],
  );

  const sections = useMemo(() => {
    const setKategorisi = CATEGORIES.find((c) => c.kind === 'sets');
    const gorunur = fixMenus.filter((set) => {
      if (gf || veg || fav) return false;
      if (!q) return true;
      return foldForSearch(`${set.name} ${set.desc}`, lang).includes(q);
    });
    if (!setKategorisi || !gorunur.length) return urunBolumleri;

    const urunlerById = new Map(urunBolumleri.map((s) => [s.id, s]));
    const out = [];
    for (const category of CATEGORIES) {
      if (category.kind === 'sets') {
        out.push({ id: category.id, title: localize(category, lang), kind: 'sets', items: gorunur });
      } else if (urunlerById.has(category.id)) {
        out.push(urunlerById.get(category.id));
      }
    }
    return out;
  }, [CATEGORIES, fixMenus, urunBolumleri, gf, veg, fav, q, lang]);

  const categories = useMemo(
    () => sections.map((s) => ({ id: s.id, label: s.title })),
    [sections]
  );

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const { active: activeCat, register, scrollTo } = useScrollSpy(sectionIds, catbarH, sections.length > 0);

  const sheet = useMemo(() => {
    if (!selectedId) return null;
    const sel = ITEMS.find((i) => i.id === selectedId);
    if (!sel) return null;
    const allergens = localize(sel.alg, lang);
    return {
      ...mapItem(sel, lang, ui, dark),
      image: sel.image_url || null,
      images: sel.images || [],
      placeholderHero: placeholderArt(sel.cat, 'hero', dark),
      variants: (sel.variants || []).map((v) => ({
        name: localize(v.name, lang),
        priceText: fmtPrice(v.price, lang),
      })),
      ingredients: localize(sel.ing, lang) || [],
      allergens: allergens && allergens.length ? allergens.join(' · ') : ui.noAlg,
    };
  }, [ITEMS, selectedId, lang, ui, dark]);

  const onSelectCategory = useCallback(
    (id) => {
      setCollapsedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      scrollTo(id);
    },
    [scrollTo]
  );

  const clearAll = useCallback(() => {
    setSearch('');
    setGf(false);
    setVeg(false);
    setFav(false);
  }, []);

  const themeVars = getMenuThemeVars(dark, accent);
  const showLoadError = !loading && !!error && CATEGORIES.length === 0 && ITEMS.length === 0;
  const showEmpty = !loading && !showLoadError && sections.length === 0;
  const favEmpty = fav && favorites.length === 0;
  const announcement = String(localize(meta.announcement, lang) || '').trim();
  const instagram = (meta.info.instagram || '').trim();
  const reviewUrl = import.meta.env.VITE_STATIC === '1' ? '' : (meta.info.google_review_url || '').trim();
  const visibleItemCount = sections.reduce((total, section) => total + section.items.length, 0);
  const ratingAvailable = !!reviewUrl && !rated && !selectedId;
  const panelShown = ratingAvailable && stripOpen;
  const fabShown = ratingAvailable && !stripOpen;

  const priceUpdatedText = (() => {
    if (!meta.price_updated_at) return '';
    const d = new Date(meta.price_updated_at);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(language.locale, { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  if (loading || showLoadError) {
    return (
      <div
        lang={lang}
        dir={language.dir}
        className="min-h-screen flex flex-col gap-4 items-center justify-center text-[15px] px-6 text-center"
        style={{ ...themeVars, background: 'var(--bg)', color: 'var(--muted)' }}
      >
        <span>{loading ? ui.loading : ui.loadError}</span>
        {showLoadError && (
          <button
            type="button"
            onClick={reload}
            className="min-h-11 px-5 rounded-full cursor-pointer"
            style={{ border: '1px solid var(--accent-text)', color: 'var(--accent-text)', background: 'transparent' }}
          >
            {ui.retry}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      lang={lang}
      dir={language.dir}
      className="yg-menu-page min-h-screen text-[15px]"
      style={{
        ...themeVars,
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: '"Jost", "Cairo", "Segoe UI", system-ui, sans-serif',
        transition: 'background 0.35s ease, color 0.35s ease',
      }}
    >
      <Header
        ui={ui}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
        lang={lang}
        onSetLang={setLang}
        rtl={language.dir === 'rtl'}
      />

      <div className="yg-menu-controls">
        {announcement !== '' && (
          <div
            className="yg-menu-notice"
            style={{ background: 'var(--ann-bg)', border: '1px solid var(--ann-border)', color: 'var(--accent-text)' }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" className="flex-none" aria-hidden="true">
              <path
                d="M2.5 12 C5.5 8.2 11 7 15.2 9.6 C16.6 10.5 17.8 11.3 19.5 12 C17.8 12.7 16.6 13.5 15.2 14.4 C11 17 5.5 15.8 2.5 12 Z M19.5 12 L22.5 9.2 M19.5 12 L22.5 14.8"
                fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="7" cy="11.2" r="0.9" fill="currentColor" />
            </svg>
            <span>{announcement}</span>
          </div>
        )}

        {meta.info.wifi && (
          <div
            className="yg-menu-wifi"
          >
            <svg width="23" height="23" viewBox="0 0 24 24" className="flex-none" style={{ color: 'var(--accent-text)' }} aria-hidden="true">
              <path
                d="M3.5 9.5 a12 12 0 0 1 17 0 M6.5 12.8 a8 8 0 0 1 11 0 M9.5 16 a4 4 0 0 1 5 0"
                fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              />
              <circle cx="12" cy="19" r="1.4" fill="currentColor" />
            </svg>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] tracking-[2px] uppercase" style={{ color: 'var(--muted2)' }}>{ui.wifi}</span>
              <span className="text-[16px] font-semibold tracking-[1.5px] select-all">{meta.info.wifi}</span>
            </div>
          </div>
        )}

        <SearchFilters
          search={search}
          onSearchChange={setSearch}
          placeholder={ui.search}
          gf={gf}
          veg={veg}
          fav={fav}
          onToggleGF={() => setGf((v) => !v)}
          onToggleVeg={() => setVeg((v) => !v)}
          onToggleFav={() => setFav((v) => !v)}
          gfLabel={ui.gf}
          vegLabel={ui.veg}
          favLabel={ui.favorites}
          clearLabel={ui.clearSearch}
        />
      </div>

      {categories.length > 0 && (
        <div
          ref={catbarRef}
          className="yg-category-dock sticky top-0 z-30"
        >
          <CategoryBar categories={categories} activeCat={activeCat} onSelect={onSelectCategory} label={ui.categories} />
        </div>
      )}

      <main className="yg-menu-main">
        {!showEmpty && (
          <div className="yg-menu-intro">
            <div>
              <p className="yg-overline">{ui.menuLabel}</p>
              <h2>{ui.menuLead}</h2>
              <p>{ui.menuIntro}</p>
            </div>
            <span className="yg-menu-intro__count">{formatItemCount(visibleItemCount, lang)}</span>
          </div>
        )}

        {showEmpty && (
          <div className="pt-14 pb-10 px-6 flex flex-col items-center gap-4 text-center">
            <div
              role="img"
              className="w-[116px] h-[116px] rounded-full"
              style={{
                backgroundImage: `url('${placeholderArt(favEmpty ? 'heart' : 'search', 'empty', dark)}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="flex flex-col gap-1.5 max-w-[340px]">
              <div className="font-outfit text-[25px] font-semibold">
                {favEmpty ? ui.emptyFavT : ui.emptySearchT}
              </div>
              <div className="text-[14px] leading-[1.55]" style={{ color: 'var(--muted)' }}>
                {favEmpty ? ui.emptyFavS : ui.emptySearchS}
              </div>
            </div>
            <button
              onClick={clearAll}
              className="min-h-11 px-[22px] rounded-full bg-transparent cursor-pointer text-[14px] font-medium"
              style={{ border: '1px solid var(--accent-text)', color: 'var(--accent-text)' }}
            >
              {ui.clear}
            </button>
          </div>
        )}

        <MenuSections
          sections={sections}
          ui={ui}
          register={register}
          scrollMargin={catbarH}
          countLabel={(count) => formatItemCount(count, lang)}
          onItemClick={openItem}
          favorites={favorites}
          onToggleFav={toggleFav}
          collapsedIds={collapsedIds}
          onToggleSection={toggleSection}
        />

        <footer
          className="yg-menu-footer"
        >
          <RatingPrompt ui={ui} lang={lang} reviewUrl={reviewUrl} done={rated} onDone={markRated} />
          <span className="font-outfit text-[21px] font-semibold">Yedigül</span>
          {meta.info.hours && (
            <span className="text-[12.5px] tracking-[.4px]" style={{ color: 'var(--muted)' }}>
              {meta.info.hours}
            </span>
          )}
          <div className="flex gap-[18px] flex-wrap justify-center text-[13.5px]">
            {meta.info.phone && (
              <a href={`tel:${meta.info.phone.replace(/\s/g, '')}`} style={{ color: 'var(--accent-text)' }}>
                {meta.info.phone}
              </a>
            )}
            {instagram && (
              <a
                href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-text)' }}
              >
                {instagram.startsWith('@') ? instagram : `@${instagram}`}
              </a>
            )}
            <a href="/" style={{ color: 'var(--accent-text)' }}>{ui.home}</a>
          </div>
          <span className="text-[12px]" style={{ color: 'var(--muted2)' }}>{ui.locationLong}</span>
          <span className="text-[11.5px] mt-1.5 max-w-[420px] leading-[1.5]" style={{ color: 'var(--muted2)' }}>
            {ui.vat}
          </span>
          {priceUpdatedText && (
            <span className="text-[11.5px]" style={{ color: 'var(--muted2)' }}>
              {ui.priceUpdated}: {priceUpdatedText}
            </span>
          )}
        </footer>
      </main>

      <BottomSheet
        sheet={sheet}
        ui={ui}
        onClose={() => setSelectedId(null)}
        isFav={selectedId ? favorites.includes(selectedId) : false}
        onToggleFav={toggleFav}
      />

      <RatingStrip
        ui={ui}
        lang={lang}
        reviewUrl={reviewUrl}
        done={rated}
        onDone={markRated}
        open={panelShown}
        onClose={() => setStripOpen(false)}
      />

      <RatingFab label={ui.rateFabLabel} visible={fabShown} onClick={() => setStripOpen(true)} />

      <ScrollTopButton label={ui.toTop} obscured={panelShown} raised={fabShown} />
    </div>
  );
}
