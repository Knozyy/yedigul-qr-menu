function FilterChip({ active, onClick, heart, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="min-h-11 px-4 flex items-center gap-[7px] rounded-full cursor-pointer text-[13.5px] font-medium transition-all duration-200"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--on-accent)' : 'var(--muted)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--faint-strong)'}`,
      }}
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
    <>
      <div className="relative">
        <svg
          width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"
          className="absolute top-1/2 -translate-y-1/2 opacity-55"
          style={{ insetInlineStart: 16, color: 'var(--muted)' }}
        >
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16.2 16.2 L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full h-12 px-[46px] rounded-full text-[15px]"
          style={{
            background: 'var(--search-bg)',
            border: '1px solid var(--search-border)',
            color: 'var(--text)',
            transition: 'background .35s ease',
          }}
        />
        {search !== '' && (
          <button
            onClick={() => onSearchChange('')}
            aria-label={clearLabel}
            className="absolute top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ insetInlineEnd: 4, color: 'var(--muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        <FilterChip active={gf} onClick={onToggleGF}>{gfLabel}</FilterChip>
        <FilterChip active={veg} onClick={onToggleVeg}>{vegLabel}</FilterChip>
        <FilterChip active={fav} onClick={onToggleFav} heart>{favLabel}</FilterChip>
      </div>
    </>
  );
}
