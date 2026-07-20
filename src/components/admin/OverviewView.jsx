import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const GUNK = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

const QUICKS = [
  { key: 'newItem', label: 'Yeni Ürün', d: 'M12 5 V19 M5 12 H19' },
  {
    key: 'bulk',
    label: 'Toplu Zam',
    d: 'M6.5 17.5 L17.5 6.5 M9.5 7.5 A2 2 0 1 1 5.5 7.5 A2 2 0 1 1 9.5 7.5 M18.5 16.5 A2 2 0 1 1 14.5 16.5 A2 2 0 1 1 18.5 16.5',
  },
  {
    key: 'settings',
    label: 'Duyuruyu Düzenle',
    d: 'M4 10 V14 M7 9 V15 M7 12 L16.5 17.5 V6.5 L7 12 M19 9.5 C20.3 10.8 20.3 13.2 19 14.5',
  },
  {
    key: 'qr',
    label: 'QR Kod',
    d: 'M4 4 H9.5 V9.5 H4 Z M14.5 4 H20 V9.5 H14.5 Z M4 14.5 H9.5 V20 H4 Z M13.5 13.5 H16 V16 H13.5 Z M18 13.5 H20 M18 17 H20 V20 M13.5 18 V20 H16',
  },
];

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid rgba(22,41,61,0.10)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(10,31,53,0.04)',
};

export default function OverviewView({ products, onQuick, onSaveDaily }) {
  const [stats, setStats] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/admin/stats').then((data) => { if (!cancelled) setStats(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const last7 = stats?.days ? stats.days.slice(-7) : [];
  const maxV = last7.length ? Math.max(...last7.map((d) => d.menu_view || 0), 1) : 1;
  const todayDay = last7.length ? last7[last7.length - 1].day : null;

  const hiddenCount = products.filter((p) => p.is_hidden).length;
  const visibleCount = products.filter((p) => !p.is_hidden).length;
  const week7Total = last7.reduce((a, d) => a + (d.menu_view || 0), 0);

  const statCards = [
    { label: 'Bugün', value: stats ? String(stats.today?.menu_view ?? 0) : '—', sub: 'menü görüntülenme' },
    { label: 'Son 7 gün', value: stats ? String(last7.length ? week7Total : (stats.week?.menu_view ?? 0)) : '—', sub: 'toplam görüntülenme' },
    { label: 'Menüde', value: String(visibleCount), sub: `${hiddenCount} ürün gizli` },
  ];

  const marketItems = products.filter((p) => p.is_market_price);

  async function handleSave() {
    setSaving(true);
    try { await onSaveDaily(draft); setDraft({}); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hızlı işlemler */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {QUICKS.map((qa) => (
          <button
            key={qa.key}
            onClick={() => onQuick(qa.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 16px',
              background: 'var(--card)', border: '1px solid rgba(22,41,61,0.18)', borderRadius: 999,
              color: 'var(--text)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ color: 'var(--gold-dk)' }}>
              <path d={qa.d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* İstatistik kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {statCards.map((st) => (
          <div key={st.label} style={{ ...cardStyle, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>{st.label}</span>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 600, lineHeight: 1.05, color: 'var(--text)' }}>{st.value}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{st.sub}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 14, alignItems: 'start' }}>
        {/* Günün Fiyatları */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 21, fontWeight: 600, color: 'var(--text)' }}>Günün Fiyatları</h3>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>piyasa fiyatlı ürünler</span>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            Fiyat girilirse menüde "Piyasa Fiyatı" yerine bugünkü fiyat gösterilir.
          </p>
          {marketItems.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '10px 0' }}>Piyasa fiyatlı ürün yok.</p>
          ) : (
            marketItems.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(22,41,61,0.08)' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--text)' }}>{p.name_tr}</span>
                  <span style={{ fontSize: 11.5, color: p.price != null ? 'var(--gold-dk)' : 'var(--muted)' }}>
                    {p.price != null ? `Güncel fiyat: ${p.price} TL` : 'Bugün girilmedi'}
                  </span>
                </div>
                <div style={{ position: 'relative', flex: '0 0 auto' }}>
                  <input
                    value={draft[p.id] ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                    inputMode="numeric"
                    placeholder="—"
                    aria-label={`${p.name_tr} bugünkü fiyat`}
                    style={{
                      width: 104, height: 44, padding: '0 38px 0 12px', background: '#FFFFFF',
                      border: '1px solid rgba(22,41,61,0.22)', borderRadius: 11, color: 'var(--text)',
                      fontSize: 15, textAlign: 'end', fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)' }}>TL</span>
                </div>
              </div>
            ))
          )}
          <button
            onClick={handleSave}
            disabled={saving || marketItems.length === 0}
            style={{
              marginTop: 12, height: 44, padding: '0 20px', border: 'none', borderRadius: 999,
              background: 'var(--gold)', color: '#081726', fontSize: 13.5, fontWeight: 600,
              cursor: 'pointer', opacity: saving || marketItems.length === 0 ? 0.6 : 1,
            }}
          >
            {saving ? 'Kaydediliyor…' : 'Fiyatları Kaydet'}
          </button>
        </div>

        {/* 7 günlük grafik */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...cardStyle, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 21, fontWeight: 600, color: 'var(--text)' }}>Menü Görüntülenme</h3>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>son 7 gün</span>
            </div>
            {last7.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>{stats ? 'Henüz veri yok.' : 'Yükleniyor…'}</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 104 }}>
                {last7.map((d) => {
                  const v = d.menu_view || 0;
                  const h = Math.max(8, Math.round((v / maxV) * 78));
                  const isToday = d.day === todayDay;
                  return (
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', height: `${h}px`, background: isToday ? 'var(--gold)' : 'var(--gold-soft)', borderRadius: '5px 5px 2px 2px' }} />
                      <span style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: 0.5 }}>{GUNK[new Date(d.day).getDay()]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
