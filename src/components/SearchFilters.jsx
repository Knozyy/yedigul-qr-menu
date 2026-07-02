function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 cursor-pointer font-inter text-[12px] font-semibold tracking-[.04em] px-2.5 py-[9px] rounded-xl flex items-center justify-center gap-1.5 border"
      style={
        active
          ? {
              background: 'var(--gold)',
              color: '#fff',
              borderColor: 'var(--gold)',
              boxShadow: '0 4px 14px rgba(200,144,47,.28)',
            }
          : { background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }
      }
    >
      {children}
    </button>
  );
}

export default function SearchFilters({ search, onSearchChange, placeholder, gf, veg, onToggleGF, onToggleVeg, gfLabel, vegLabel }) {
  return (
    <div className="px-5 pt-0.5 pb-4" style={{ background: 'var(--bg)' }}>
      <div
        className="flex items-center gap-2.5 px-4 h-[46px] rounded-[14px] border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 2px 10px var(--shadow)' }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border-none outline-none bg-transparent font-inter text-[14.5px] min-w-0"
          style={{ color: 'var(--text)' }}
        />
      </div>
      <div className="flex gap-[9px] mt-[11px]">
        <FilterChip active={gf} onClick={onToggleGF}>
          {gfLabel}
        </FilterChip>
        <FilterChip active={veg} onClick={onToggleVeg}>
          {vegLabel}
        </FilterChip>
      </div>
    </div>
  );
}
