import { useEffect, useRef } from 'react';

// Alt çizgili (editoryal) kategori sekmeleri. Yapışkan sarmalayıcı ve
// blur arka plan MenuPage'dedir; burada yalnızca kaydırılabilir şerit var.
export default function CategoryBar({ categories, activeCat, onSelect, label }) {
  const navRef = useRef(null);
  const btnRefs = useRef({});

  useEffect(() => {
    const btn = btnRefs.current[activeCat];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const target = btn.offsetLeft - (nav.clientWidth - btn.clientWidth) / 2;
    nav.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeCat]);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="yg-category-bar yg-scroll"
    >
      {categories.map((cat) => {
        const active = cat.id === activeCat;
        return (
          <button
            key={cat.id}
            ref={(el) => {
              if (el) btnRefs.current[cat.id] = el;
            }}
            onClick={() => onSelect(cat.id)}
            className={`yg-category-pill${active ? ' is-active' : ''}`}
          >
            {cat.label}
          </button>
        );
      })}
    </nav>
  );
}
