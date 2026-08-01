import { useState } from 'react';

const NAVD = {
  home: 'M4 11.2 L12 4.4 L20 11.2 M6.4 9.6 V19.4 H17.6 V9.6',
  items: 'M2.5 12 C5.5 8.2 11 7 15.2 9.6 C16.6 10.5 17.8 11.3 19.5 12 C17.8 12.7 16.6 13.5 15.2 14.4 C11 17 5.5 15.8 2.5 12 Z M19.5 12 L22 9.4 M19.5 12 L22 14.6',
  cats: 'M12 3.6 L20.5 8.3 L12 13 L3.5 8.3 Z M4.8 12.4 L12 16.4 L19.2 12.4 M4.8 16.2 L12 20.2 L19.2 16.2',
  settings: 'M12 8.8 A3.2 3.2 0 1 0 12 15.2 A3.2 3.2 0 1 0 12 8.8 M12 3 V5.4 M12 18.6 V21 M3 12 H5.4 M18.6 12 H21 M5.6 5.6 L7.3 7.3 M16.7 16.7 L18.4 18.4 M18.4 5.6 L16.7 7.3 M7.3 16.7 L5.6 18.4',
  qr: 'M4 4 H9.5 V9.5 H4 Z M14.5 4 H20 V9.5 H14.5 Z M4 14.5 H9.5 V20 H4 Z M13.5 13.5 H16 V16 H13.5 Z M18 13.5 H20 M18 17 H20 V20 M13.5 18 V20 H16',
};

const NAV_ITEMS = [
  { id: 'home', label: 'Genel Bakış', d: NAVD.home },
  { id: 'items', label: 'Ürünler', d: NAVD.items },
  { id: 'cats', label: 'Kategoriler', d: NAVD.cats },
  { id: 'settings', label: 'Ayarlar', d: NAVD.settings },
  { id: 'qr', label: 'QR Kod', d: NAVD.qr },
];

function AdminNavSideItem({ item, active, onSelect }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 46,
        padding: '0 16px',
        background: active ? 'rgba(255,255,255,0.06)' : hover ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none',
        borderInlineStart: `3px solid ${active ? 'var(--gold)' : 'transparent'}`,
        color: active ? 'var(--gold-lt)' : 'rgba(242,233,214,0.72)',
        fontSize: '14.5px',
        fontWeight: active ? 600 : 400,
        letterSpacing: '0.3px',
        cursor: 'pointer',
        textAlign: 'start',
        width: '100%',
        transition: 'all 0.2s ease',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" style={{ flex: '0 0 auto' }} aria-hidden="true">
        <path d={item.d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{item.label}</span>
    </button>
  );
}

export default function AdminNav({ view, onSelect, variant }) {
  const side = variant === 'side';

  if (side) {
    return (
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 0' }}>
        {NAV_ITEMS.map((it) => (
          <AdminNavSideItem key={it.id} item={it} active={view === it.id} onSelect={onSelect} />
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Bölümler"
      style={{
        display: 'flex',
        padding: '6px 4px calc(6px + env(safe-area-inset-bottom))',
      }}
    >
      {NAV_ITEMS.map((it) => {
        const active = view === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              minHeight: 52,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              color: active ? 'var(--gold-lt)' : 'rgba(242,233,214,0.6)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
              <path d={it.d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.3px' }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
