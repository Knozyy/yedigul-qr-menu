import ProductCard from './ProductCard';
import FixMenuCard from './FixMenuCard';

export default function MenuSections({
  sections,
  ui,
  register,
  scrollMargin,
  countLabel,
  onItemClick,
  favorites,
  onToggleFav,
  collapsedIds,
  onToggleSection,
}) {
  return (
    <div className="yg-menu-sections">
      {sections.map((section) => {
        const isCollapsed = collapsedIds.has(section.id);
        return (
          <section
            key={section.id}
            ref={register(section.id)}
            className="yg-menu-section"
            style={{ scrollMarginTop: scrollMargin + 12 }}
          >
            <button
              type="button"
              onClick={() => onToggleSection(section.id)}
              aria-expanded={!isCollapsed}
              className="yg-menu-section__toggle"
            >
              <h2
                className="yg-menu-section__title"
              >
                {section.title}
              </h2>
              <span className="yg-menu-section__count">
                {countLabel(section.items.length)}
              </span>
              <span className="yg-menu-section__rule" />
              <svg
                width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"
                className={`yg-menu-section__chevron ${isCollapsed ? 'is-collapsed' : ''}`}
              >
                <path d="M6 9 L12 15 L18 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {!isCollapsed && (
              <div
                className={`yg-menu-section__grid${section.kind === 'sets' ? ' yg-menu-section__grid--sets' : ''}`}
              >
                {section.kind === 'sets'
                  ? section.items.map((set) => (
                    <FixMenuCard
                      key={set.id}
                      set={set}
                      priceText={set.priceText}
                      perPersonLabel={ui.perPerson}
                    />
                  ))
                  : section.items.map((item) => (
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
    </div>
  );
}
