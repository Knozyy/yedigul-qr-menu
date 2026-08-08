function FilterChip({ active, onClick, heart, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`yg-filter-chip${active ? ' is-active' : ''}`}
    >
      {heart && (
        <svg width="14" height="14" viewBox="0 0 24 24" className="flex-none" aria-hidden="true">
          <path
            d="M12 20.3 C6.4 15.6 3.5 12.4 3.5 9 C3.5 6.4 5.5 4.5 8 4.5 C9.6 4.5 11.1 5.3 12 6.7 C12.9 5.3 14.4 4.5 16 4.5 C18.5 4.5 20.5 6.4 20.5 9 C20.5 12.4 17.6 15.6 12 20.3 Z"
            fill="none" stroke="currentColor" strokeWidth="1.8"
          />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
}

export default function SearchFilters({
  search, onSearchChange, placeholder,
  gf, veg, fav,
  onToggleGF, onToggleVeg, onToggleFav,
  gfLabel, vegLabel, favLabel, clearLabel,
}) {
  return (
    <div className="yg-search-filters">
      <div className="yg-search-field">
        <svg
          width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"
          className="yg-search-field__icon"
        >
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16.2 16.2 L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="yg-search-field__input"
        />
        {search !== '' && (
          <button
            onClick={() => onSearchChange('')}
            aria-label={clearLabel}
            className="yg-search-field__clear"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="yg-filter-row yg-scroll">
        <FilterChip active={gf} onClick={onToggleGF}>{gfLabel}</FilterChip>
        <FilterChip active={veg} onClick={onToggleVeg}>{vegLabel}</FilterChip>
        <FilterChip active={fav} onClick={onToggleFav} heart>{favLabel}</FilterChip>
      </div>
    </div>
  );
}
