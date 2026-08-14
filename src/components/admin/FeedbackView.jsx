import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid rgba(22,41,61,0.10)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(10,31,53,0.04)',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const btnStyle = {
  height: 36,
  padding: '0 14px',
  border: '1px solid rgba(22,41,61,0.22)',
  borderRadius: 999,
  background: 'transparent',
  color: 'var(--text)',
  fontSize: 13,
  cursor: 'pointer',
};

const dateStyle = {
  height: 40,
  padding: '0 10px',
  background: '#FFFFFF',
  border: '1px solid rgba(22,41,61,0.22)',
  borderRadius: 10,
  color: 'var(--text)',
  fontSize: 14,
};

const tarih = (ms) =>
  new Date(ms).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const yildiz = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

const yerelTarih = (d) => {
  const yil = d.getFullYear();
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gun = String(d.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
};

const bugun = () => yerelTarih(new Date());
const gunOnce = (n) => yerelTarih(new Date(Date.now() - n * 86400000));

export default function FeedbackView({ onError, onUnread }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [from, setFrom] = useState(() => gunOnce(30));
  const [to, setTo] = useState(bugun);

  const reload = useCallback(async () => {
    try {
      const data = await api.get(`/admin/feedback?from=${from}&to=${to}`);
      setItems(data.items);
      onUnread(data.unread);
    } catch (e) {
      onError(e.message);
    } finally {
      setLoaded(true);
    }
  }, [from, to, onError, onUnread]);

  useEffect(() => { reload(); }, [reload]);

  async function toggleRead(item) {
    try {
      await api.patch(`/admin/feedback/${item.id}/read`, { is_read: !item.is_read });
      await reload();
    } catch (e) {
      onError(e.message);
    }
  }

  async function remove(item) {
    if (!window.confirm('Bu geri bildirim silinsin mi?')) return;
    try {
      await api.del(`/admin/feedback/${item.id}`);
      await reload();
    } catch (e) {
      onError(e.message);
    }
  }

  const filtre = (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--muted)' }}>Başlangıç</span>
        <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} style={dateStyle} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--muted)' }}>Bitiş</span>
        <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={dateStyle} />
      </label>
    </div>
  );

  if (!loaded) return <p style={{ fontSize: 13, color: 'var(--muted)' }}>Yükleniyor…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
      {filtre}

      {!items.length && (
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Seçili aralıkta geri bildirim yok. Menüde 4 yıldızın altında puan veren misafirlerin
          yazdıkları burada birikir.
        </p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            ...cardStyle,
            borderInlineStart: `3px solid ${item.is_read ? 'transparent' : 'var(--gold)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--gold)', fontSize: 16, letterSpacing: 2 }}>{yildiz(item.rating)}</span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{tarih(item.created_at)}</span>
            <span style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--muted)' }}>
              {item.lang}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.message}</p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={btnStyle} onClick={() => toggleRead(item)}>
              {item.is_read ? 'Okunmadı yap' : 'Okundu'}
            </button>
            <button type="button" style={{ ...btnStyle, color: '#ef6b6b' }} onClick={() => remove(item)}>
              Sil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
