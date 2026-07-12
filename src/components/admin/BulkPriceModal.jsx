import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const CHIP_VALUES = ['5', '10', '15', '25'];

function toNum(v) {
  return parseFloat(String(v).replace(',', '.')) || 0;
}

// mockup birebir: Math.max(1, Math.round(p * (1 + pct/100) / rd) * rd)
function nextPrice(p, pct, rd) {
  return Math.max(1, Math.round((p * (1 + pct / 100)) / rd) * rd);
}

// kapsama uyan VE sabit fiyatlı (piyasa fiyatlı olmayan) ürünler
function bulkAffected(products, scope) {
  return products.filter(
    (p) => (scope === 'all' || p.category_id === scope) && (p.price != null || (p.variants && p.variants.length))
  );
}

export default function BulkPriceModal({ products, categories, onClose, onApplied }) {
  const [pct, setPct] = useState('10');
  const [scope, setScope] = useState('all');
  const [round, setRound] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [w, setW] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = w < 780;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const pctNum = toNum(pct);
  const rd = parseInt(round, 10) || 1;
  const next = (p) => nextPrice(p, pctNum, rd);

  const affected = bulkAffected(products, scope);
  const withPrice = affected.filter((p) => p.price != null).slice(0, 3);
  const moreCount = affected.length - withPrice.length;

  async function handleApply() {
    setBusy(true);
    setError('');
    let count = 0;
    for (const p of affected) {
      const body = {};
      if (p.price != null) body.price = next(p.price);
      if (p.variants && p.variants.length) body.variants = p.variants.map((v) => ({ ...v, price: next(v.price) }));
      try {
        await api.patch(`/admin/products/${p.id}`, body);
        count++;
      } catch (err) {
        setError(err.message);
      }
    }
    setBusy(false);
    onApplied(count);
  }

  const dialogStyle = isMobile
    ? {
        position: 'absolute', inset: 'auto 0 0 0', width: 'auto', maxWidth: '580px', margin: '0 auto',
        maxHeight: '90vh', borderRadius: '24px 24px 0 0',
      }
    : {
        position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)',
        width: 'min(580px, 94vw)', maxWidth: '580px', maxHeight: '86vh', borderRadius: 20,
      };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80 }}>
      <div
        onClick={onClose}
        className="yg-anim-overlay"
        style={{ position: 'absolute', inset: 0, background: 'rgba(5,14,25,0.55)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          ...dialogStyle,
          overflowY: 'auto',
          background: 'var(--card-2)',
          boxShadow: '0 -16px 48px rgba(4,12,22,0.35)',
        }}
      >
        <div style={{ padding: '20px 22px 30px', display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, flex: 1, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 25, fontWeight: 600, color: 'var(--text)' }}>
              Toplu Fiyat Güncelleme
            </h3>
            <button
              onClick={onClose}
              aria-label="Kapat"
              style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'rgba(22,41,61,0.06)',
                color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Seçilen kapsamdaki tüm fiyatlara yüzde uygulanır. Negatif değerle indirim yapabilirsiniz.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <button
              onClick={() => setPct(String(toNum(pct) - 5))}
              aria-label="Azalt"
              style={{
                width: 46, height: 46, borderRadius: '50%', border: '1px solid rgba(22,41,61,0.25)', background: 'none',
                color: 'var(--text)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              −
            </button>
            <div style={{ position: 'relative' }}>
              <input
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                inputMode="numeric"
                aria-label="Yüzde"
                style={{
                  width: 110, height: 56, padding: '0 30px 0 12px', background: '#FFFFFF',
                  border: '1px solid rgba(22,41,61,0.25)', borderRadius: 14, color: 'var(--text)',
                  fontSize: 24, fontWeight: 600, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                }}
              />
              <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: 'var(--muted)' }}>%</span>
            </div>
            <button
              onClick={() => setPct(String(toNum(pct) + 5))}
              aria-label="Artır"
              style={{
                width: 46, height: 46, borderRadius: '50%', border: '1px solid rgba(22,41,61,0.25)', background: 'none',
                color: 'var(--text)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {CHIP_VALUES.map((p) => {
              const active = String(pct) === p;
              return (
                <button
                  key={p}
                  onClick={() => setPct(p)}
                  style={{
                    minHeight: 38, padding: '0 14px',
                    background: active ? 'var(--gold)' : 'transparent',
                    color: active ? '#081726' : 'var(--muted-2)',
                    border: `1px solid ${active ? 'var(--gold)' : 'rgba(22,41,61,0.25)'}`,
                    borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  %{p}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <label style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Kapsam</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                style={{
                  width: '100%', height: 46, padding: '0 10px', background: '#FFFFFF',
                  border: '1px solid rgba(22,41,61,0.22)', borderRadius: 12, color: 'var(--text)', fontSize: 14,
                }}
              >
                <option value="all">Tüm menü</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_tr}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <label style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Yuvarlama</label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                style={{
                  width: '100%', height: 46, padding: '0 10px', background: '#FFFFFF',
                  border: '1px solid rgba(22,41,61,0.22)', borderRadius: 12, color: 'var(--text)', fontSize: 14,
                }}
              >
                <option value="1">1 TL'ye</option>
                <option value="5">5 TL'ye</option>
                <option value="10">10 TL'ye</option>
                <option value="25">25 TL'ye</option>
              </select>
            </div>
          </div>

          <div style={{ border: '1.5px dashed rgba(22,41,61,0.22)', borderRadius: 14, padding: '12px 15px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, paddingBottom: 4 }}>Önizleme</span>
            {withPrice.length === 0 ? (
              <span style={{ fontSize: 12.5, color: 'var(--muted)', padding: '7px 0' }}>Bu kapsamda etkilenecek sabit fiyatlı ürün yok.</span>
            ) : (
              withPrice.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(22,41,61,0.08)', fontSize: 13.5 }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{p.name_tr}</span>
                  <span style={{ color: 'var(--muted)', textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>{p.price} TL</span>
                  <span style={{ color: 'var(--muted)' }}>→</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{next(p.price)} TL</span>
                </div>
              ))
            )}
            {moreCount > 0 && (
              <span style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 8 }}>+ {moreCount} ürün daha etkilenecek</span>
            )}
          </div>

          {error && <span style={{ fontSize: 12.5, color: 'var(--danger)' }}>{error}</span>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={busy}
              style={{
                flex: 1, height: 48, background: 'transparent', border: '1px solid rgba(22,41,61,0.30)',
                borderRadius: 999, color: 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Vazgeç
            </button>
            <button
              onClick={handleApply}
              disabled={busy || affected.length === 0}
              style={{
                flex: 1.6, height: 48, border: 'none', borderRadius: 999, background: 'var(--gold)',
                color: '#081726', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: busy || affected.length === 0 ? 0.6 : 1,
              }}
            >
              {busy ? 'Uygulanıyor…' : `Uygula · ${affected.length} ürün`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
