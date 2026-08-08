import { useMemo, useState } from 'react';
import { api } from '../../lib/api';

const norm = (s) => (s || '').toLowerCase()
  .replace(/i̇/g, 'i').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
  .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

function priceText(p) {
  if (p.is_market_price) return 'Piyasa fiyatı';
  const vs = p.variants || [];
  if (vs.length) {
    const ps = vs.map((v) => v.price);
    const min = Math.min(...ps), max = Math.max(...ps);
    return min === max ? `${min} TL` : `${min}–${max} TL`;
  }
  return `${p.price ?? '—'} TL`;
}

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid rgba(22,41,61,0.10)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(10,31,53,0.04)',
  overflow: 'hidden',
};

export default function ProductsView({ categories, products, onEdit, onReload, onError, onAdd, onBulk }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    return products.filter((p) => {
      if (cat !== 'all' && p.category_id !== cat) return false;
      if (nq && !norm(p.name_tr).includes(nq) && !norm(p.name_en).includes(nq) && !norm(p.desc_tr).includes(nq)) return false;
      return true;
    });
  }, [products, q, cat]);

  const hiddenCount = filtered.filter((p) => p.is_hidden).length;

  async function onToggleAvailable(product, next) {
    try { await api.patch(`/admin/products/${product.id}`, { is_available: next }); onReload(); }
    catch (e) { onError(e.message); }
  }

  const chipStyle = (active) => ({
    flex: '0 0 auto', minHeight: 40, padding: '0 15px',
    background: active ? 'var(--gold)' : 'transparent',
    color: active ? '#081726' : 'var(--muted-2)',
    border: `1px solid ${active ? 'var(--gold)' : 'rgba(22,41,61,0.25)'}`,
    borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 190 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
            <path d="M16.2 16.2 L21 21 M18 11 A7 7 0 1 1 4 11 A7 7 0 1 1 18 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün ara…"
            aria-label="Ürün ara"
            style={{
              width: '100%', height: 46, padding: '0 40px 0 42px', background: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(22,41,61,0.20)', borderRadius: 999, color: 'var(--text)', fontSize: 14.5,
            }}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              aria-label="Temizle"
              style={{
                position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42,
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none',
                color: 'var(--muted)', cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
        <button
          onClick={onBulk}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, minHeight: 46, padding: '0 16px',
            background: 'transparent', border: '1px solid rgba(22,41,61,0.30)', borderRadius: 999,
            color: 'var(--text)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"><path d="M6.5 17.5 L17.5 6.5 M9.5 7.5 A2 2 0 1 1 5.5 7.5 A2 2 0 1 1 9.5 7.5 M18.5 16.5 A2 2 0 1 1 14.5 16.5 A2 2 0 1 1 18.5 16.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          <span>Toplu Zam</span>
        </button>
        <button
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, minHeight: 46, padding: '0 18px',
            background: 'var(--gold)', border: 'none', borderRadius: 999,
            color: '#081726', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 5 V19 M5 12 H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span>Yeni Ürün</span>
        </button>
      </div>

      <div className="nosb" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        <button onClick={() => setCat('all')} style={chipStyle(cat === 'all')}>Tümü</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} style={chipStyle(cat === c.id)}>{c.name_tr}</button>
        ))}
      </div>

      <span style={{ fontSize: 12.5, color: 'var(--muted)', letterSpacing: 0.3 }}>
        {filtered.length} ürün{hiddenCount ? ` · ${hiddenCount} gizli` : ''}
      </span>

      <div style={cardStyle}>
        {filtered.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>
            Aramanızla eşleşen ürün yok.
          </div>
        ) : (
          filtered.map((p) => {
            const dim = p.is_hidden || p.is_available === 0;
            const category = catById[p.category_id];
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid rgba(22,41,61,0.08)' }}>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt=""
                    loading="lazy"
                    width={46}
                    height={46}
                    style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover', flex: '0 0 auto', opacity: dim ? 0.5 : 1 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 46, height: 46, borderRadius: 10, flex: '0 0 auto', opacity: dim ? 0.5 : 1,
                      background: 'repeating-linear-gradient(135deg, rgba(22,41,61,0.07) 0 5px, rgba(22,41,61,0.025) 5px 10px)',
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, opacity: dim ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{p.name_tr}</span>
                    {p.is_hidden && (
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', padding: '2.5px 8px', border: '1px solid rgba(22,41,61,0.30)', color: 'var(--muted-2)', borderRadius: 999 }}>
                        Gizli
                      </span>
                    )}
                    {p.popular && (
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', padding: '2.5px 8px', background: 'var(--gold-soft)', color: 'var(--gold-dk)', borderRadius: 999 }}>
                        Popüler
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--muted-2)' }}>
                    {category ? `${category.name_tr} · ` : ''}{priceText(p)}
                  </span>
                </div>
                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <button
                    role="switch"
                    aria-checked={p.is_available === 0}
                    aria-label="Tükendi"
                    onClick={() => onToggleAvailable(p, p.is_available ? 0 : 1)}
                    style={{
                      width: 44, height: 25, borderRadius: 999, border: 'none',
                      background: p.is_available === 0 ? 'var(--gold)' : 'rgba(22,41,61,0.18)',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute', top: 3, left: 3, width: 19, height: 19, borderRadius: '50%',
                        background: '#FFFDF6', boxShadow: '0 1px 3px rgba(10,31,53,0.35)',
                        transform: p.is_available === 0 ? 'translateX(19px)' : 'translateX(0)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                  <span style={{ fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--muted)' }}>Tükendi</span>
                </div>
                <button
                  onClick={() => onEdit(p)}
                  aria-label="Düzenle"
                  style={{
                    flex: '0 0 auto', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: '1px solid rgba(22,41,61,0.16)', borderRadius: '50%', color: 'var(--muted-2)', cursor: 'pointer',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M4.8 19.2 L8.6 18.4 L19 8 A2.1 2.1 0 0 0 16 5 L5.6 15.4 Z M13.8 7.2 L16.8 10.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
