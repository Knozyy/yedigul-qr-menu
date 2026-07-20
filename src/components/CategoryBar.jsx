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
      className="yg-scroll max-w-[980px] mx-auto flex gap-5 overflow-x-auto px-4 py-2.5"
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
            className="flex-none min-h-11 px-1 bg-transparent border-none cursor-pointer text-[14px] tracking-[.3px] whitespace-nowrap transition-colors duration-200"
            style={{
              color: active ? 'var(--text)' : 'var(--muted)',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: active ? 600 : 400,
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </nav>
  );
}
