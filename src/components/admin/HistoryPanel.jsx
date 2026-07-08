import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// Değişiklik geçmişi: backend audit_log'undan son kayıtlar (GET /admin/history).
const ACTION = { create: 'Eklendi', update: 'Güncellendi', delete: 'Silindi', image: 'Görsel' };
const ACTION_COLOR = { create: '#3ba55d', update: 'var(--gold)', delete: '#ef6b6b', image: '#7aa2d6' };
const ENTITY = { product: 'Ürün', category: 'Kategori', settings: 'Ayarlar' };

export default function HistoryPanel() {
  const [entries, setEntries] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/admin/history?limit=200')
      .then((r) => setEntries(r.entries || []))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="mb-4 p-4 rounded-xl border flex flex-col gap-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <h2 className="font-outfit text-base font-semibold" style={{ color: 'var(--text)' }}>Değişiklik Geçmişi</h2>
      {err && <span className="text-sm" style={{ color: '#ef6b6b' }}>{err}</span>}
      {entries === null && !err && <p className="text-sm" style={{ color: 'var(--muted)' }}>Yükleniyor…</p>}
      {entries && entries.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>Henüz kayıt yok.</p>}
      {entries && entries.length > 0 && (
        <div className="flex flex-col divide-y max-h-[420px] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
          {entries.map((e) => (
            <div key={e.id} className="py-2 flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10.5px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: 'var(--gold-tint)', color: ACTION_COLOR[e.action] || 'var(--text)' }}
                >
                  {ACTION[e.action] || e.action}
                </span>
                <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>{ENTITY[e.entity] || e.entity}</span>
                <span className="text-[11px] ml-auto" style={{ color: 'var(--muted)' }}>
                  {new Date(e.ts).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              {e.detail && <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{e.detail}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
