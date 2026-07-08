import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// Restoran bilgileri + duyuru ayarları. Bu alanlar menüde gösterilir:
//  - Wi-Fi şifresi menünün EN ÜSTÜNDE belirgin kartta,
//  - telefon / saat / instagram alt bilgi bloğunda,
//  - duyuru üstteki şerit.
// Backend: GET/PUT /admin/settings (server/routes/admin.js TEXT_SETTINGS).
const FIELDS = [
  { key: 'info_wifi', label: 'Wi-Fi Şifresi', placeholder: 'örn. yedigul2024' },
  { key: 'info_phone', label: 'Telefon', placeholder: '0216 000 00 00' },
  { key: 'info_hours', label: 'Çalışma Saatleri', placeholder: 'Her gün 09:00 – 24:00' },
  { key: 'info_instagram', label: 'Instagram', placeholder: '@yedigulrestorant' },
  { key: 'announcement_tr', label: 'Duyuru (TR)', placeholder: 'örn. Bugün taze levrek var!' },
  { key: 'announcement_en', label: 'Duyuru (EN)', placeholder: 'e.g. Fresh sea bass today!' },
  { key: 'announcement_ar', label: 'Duyuru (AR)', placeholder: 'مثال: سمك القاروس طازج اليوم!', dir: 'rtl' },
  { key: 'announcement_ru', label: 'Duyuru (RU)', placeholder: 'напр. Сегодня свежий сибас!' },
];

export default function InfoPanel() {
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then((s) => {
        const f = {};
        for (const { key } of FIELDS) f[key] = s[key] || '';
        setForm(f);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  async function onSave() {
    setErr(''); setMsg(''); setSaving(true);
    try {
      const res = await api.put('/admin/settings', form);
      const f = {};
      for (const { key } of FIELDS) f[key] = res[key] || '';
      setForm(f);
      setMsg('Bilgiler kaydedildi');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none w-full';
  const fieldStyle = { borderColor: 'var(--border-strong)', color: 'var(--text)' };

  return (
    <div className="mb-4 p-4 rounded-xl border flex flex-col gap-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <h2 className="font-outfit text-base font-semibold" style={{ color: 'var(--text)' }}>Restoran Bilgileri</h2>
      <p className="text-[12px] -mt-1" style={{ color: 'var(--muted)' }}>
        Wi-Fi şifresi menünün en üstünde gösterilir. Boş bıraktığın alan menüde görünmez.
      </p>

      {form === null ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Yükleniyor…</p>
      ) : (
        <>
          {FIELDS.map(({ key, label, placeholder, dir }) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{label}</span>
              <input
                className={field}
                style={fieldStyle}
                dir={dir}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
              style={{ background: 'var(--gold)', color: '#fff' }}
            >
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            {msg && <span className="text-sm" style={{ color: 'var(--gold)' }}>{msg}</span>}
            {err && <span className="text-sm" style={{ color: '#ef6b6b' }}>{err}</span>}
          </div>
        </>
      )}
    </div>
  );
}
