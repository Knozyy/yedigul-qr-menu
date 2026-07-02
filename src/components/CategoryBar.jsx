import { useEffect, useRef } from 'react';

export default function CategoryBar({ categories, activeCat, onSelect }) {
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
      className="yg-scroll flex gap-[9px] px-5 pt-3.5 pb-3 overflow-x-auto whitespace-nowrap"
      style={{ background: 'var(--bg)' }}
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
            className="flex-none cursor-pointer font-inter text-[12.5px] tracking-[.05em] px-[17px] py-[9px] rounded-full border"
            style={
              active
                ? {
                    fontWeight: 600,
                    background: 'var(--navy-2)',
                    color: '#fff',
                    borderColor: 'var(--navy-2)',
                    boxShadow: '0 5px 16px rgba(30,58,138,.26)',
                  }
                : {
                    fontWeight: 500,
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    borderColor: 'var(--border)',
                    boxShadow: 'none',
                  }
            }
          >
            {cat.label}
          </button>
        );
      })}
    </nav>
  );
}
