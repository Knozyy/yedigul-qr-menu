import ProductCard from './ProductCard';

export default function MenuSections({
  sections,
  ui,
  register,
  scrollMargin,
  countWord,
  onItemClick,
  favorites,
  onToggleFav,
  collapsedIds,
  onToggleSection,
}) {
  return (
    <>
      {sections.map((section) => {
        const isCollapsed = collapsedIds.has(section.id);
        return (
          <section
            key={section.id}
            ref={register(section.id)}
            style={{ scrollMarginTop: scrollMargin + 8, paddingTop: 14 }}
          >
            <button
              type="button"
              onClick={() => onToggleSection(section.id)}
              aria-expanded={!isCollapsed}
              className="w-full min-h-12 flex items-center gap-3 bg-transparent border-none cursor-pointer text-start py-2.5 px-0"
              style={{ color: 'inherit' }}
            >
              <h2
                className="m-0 font-outfit text-[27px] font-semibold leading-[1.1] tracking-[.2px]"
                style={{ color: 'var(--text)' }}
              >
                {section.title}
              </h2>
              <span className="flex-none text-[12.5px] tracking-[.5px] font-normal" style={{ color: 'var(--muted2)' }}>
                {section.items.length} {countWord}
              </span>
              <span className="flex-1" style={{ borderTop: '1px solid var(--faint)' }} />
              <svg
                width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"
                className={`flex-none transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                style={{ color: 'var(--muted2)' }}
              >
                <path d="M6 9 L12 15 L18 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {!isCollapsed && (
              <div
                className="grid items-start"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))', gap: '0 44px' }}
              >
                {section.items.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    ui={ui}
                    onClick={() => onItemClick(item.id)}
                    isFav={favorites.includes(item.id)}
                    onToggleFav={onToggleFav}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
