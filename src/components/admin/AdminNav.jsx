// Inline SVG ikonlar (CSP: harici kaynak yok). Nav öğeleri tek kaynak.
const Icon = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const ICONS = {
  products: <path d="M3 7h18M3 12h18M3 17h18" />,
  categories: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 8v4l3 2" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v7M14 20h7" /></>,
};

export const NAV_ITEMS = [
  { id: 'products', label: 'Ürünler' },
  { id: 'categories', label: 'Kategoriler' },
  { id: 'info', label: 'Bilgiler' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'qr', label: 'QR Kod' },
];

export default function AdminNav({ view, onSelect, variant }) {
  const side = variant === 'side';
  return (
    <nav className={side ? 'flex flex-col gap-1' : 'flex items-stretch justify-around'}>
      {NAV_ITEMS.map((it) => {
        const active = view === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            aria-current={active ? 'page' : undefined}
            className={
              side
                ? 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium text-left'
                : 'flex flex-col items-center gap-0.5 flex-1 py-1.5 text-[10.5px] font-medium'
            }
            style={{
              color: active ? 'var(--gold)' : 'var(--muted)',
              background: side && active ? 'var(--gold-tint)' : 'transparent',
            }}
          >
            <Icon d={ICONS[it.id]} />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
