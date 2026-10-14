import { useCallback, useEffect, useState } from 'react';

// Tarih dizeleri YEREL günden üretilir. toISOString() UTC verir ve sunucu bu
// dizeyi yerel gün sınırı olarak yorumladığı için TR'de (UTC+3) gece 00:00-03:00
// arasında gelen yorumlar bir önceki güne düşüp listeden kaybolurdu.
const yerelGun = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const bugun = () => yerelGun(new Date());
const gunOnce = (n) => yerelGun(new Date(Date.now() - n * 86400000));

const yildiz = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

const tarih = (ms) => new Date(ms).toLocaleString('tr-TR', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function Feedback({ request }) {
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);
  const [from, setFrom] = useState(() => gunOnce(30));
  const [to, setTo] = useState(bugun);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(0);

  const reload = useCallback(async () => {
    setError('');
    try {
      const data = await request('get', `/admin/feedback?from=${from}&to=${to}`);
      setItems(data.items);
      setUnread(data.unread);
    } catch (e) {
      setError(e.message);
      setItems([]);
    }
  }, [request, from, to]);

  useEffect(() => { reload(); }, [reload]);

  async function toggleRead(item) {
    setBusy(item.id);
    try {
      await request('patch', `/admin/feedback/${item.id}/read`, { is_read: !item.is_read });
      await reload();
    } catch (e) { setError(e.message); }
    finally { setBusy(0); }
  }

  async function remove(item) {
    if (!window.confirm('Bu geri bildirim kalıcı olarak silinsin mi?')) return;
    setBusy(item.id);
    try {
      await request('del', `/admin/feedback/${item.id}`);
      await reload();
    } catch (e) { setError(e.message); }
    finally { setBusy(0); }
  }

  return <div className="view-stack">
    <header className="page-heading">
      <div>
        <span className="eyebrow">MİSAFİR GERİ BİLDİRİMİ</span>
        <h1>Yorumlar</h1>
      </div>
      <div className="page-heading-actions">
        <strong>{unread} okunmamış</strong>
      </div>
    </header>

    <section className="panel-card">
      <div className="form-grid two">
        <label className="field"><span>Başlangıç</span><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="field"><span>Bitiş</span><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <p className="form-hint" style={{ margin: '13px 0 0' }}>
        Menüde 4 yıldızın altında puan veren misafirlerin yazdıkları burada birikir.
        4 ve üzeri puan verenler doğrudan Google&apos;a yönlendirilir, buraya düşmez.
      </p>
    </section>

    {error && <div className="alert error">{error}</div>}

    {items === null
      ? <section className="panel-card"><p className="empty-text">Yorumlar yükleniyor…</p></section>
      : items.length === 0
        ? <section className="panel-card"><p className="empty-text">Seçili tarih aralığında geri bildirim yok.</p></section>
        : items.map((item) => (
          <section
            key={item.id}
            className="panel-card"
            style={item.is_read ? undefined : { borderInlineStart: '3px solid var(--gold, #af8740)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap', marginBottom: 9 }}>
              <span style={{ color: '#af8740', fontSize: 15, letterSpacing: 2 }}>{yildiz(item.rating)}</span>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{tarih(item.created_at)}</span>
              <span style={{ fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--muted)' }}>{item.lang}</span>
            </div>
            <p style={{ margin: '0 0 13px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.message}</p>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <button type="button" className="secondary-button" disabled={busy === item.id} onClick={() => toggleRead(item)}>
                {item.is_read ? 'Okunmadı yap' : 'Okundu'}
              </button>
              <button type="button" className="danger-button" disabled={busy === item.id} onClick={() => remove(item)}>
                Sil
              </button>
            </div>
          </section>
        ))}
  </div>;
}
