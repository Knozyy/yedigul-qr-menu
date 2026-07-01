import { useState } from 'react';
import { api } from '../../lib/api';

// "Şaraplar & Kokteyller" -> "saraplar-kokteyller"
function slugify(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (ch) => map[ch])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoryForm({ categories, onChanged }) {
  const [nameTr, setNameTr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [error, setError] = useState('');

  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none';
  const fieldStyle = { borderColor: 'var(--border-strong)', color: 'var(--text)' };

  async function onAdd(e) {
    e.preventDefault();
    setError('');
    const base = slugify(nameTr);
    if (!base) {
      setError('Geçerli bir kategori adı girin.');
      return;
    }
    // avoid id collisions with existing categories
    let id = base;
    for (let n = 2; categories.some((c) => c.id === id); n++) id = `${base}-${n}`;
    try {
      await api.post('/admin/categories', { id, name_tr: nameTr, name_en: nameEn });
      setNameTr(''); setNameEn('');
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(catId) {
    if (!confirm('Kategori silinsin mi?')) return;
    setError('');
    try {
      await api.del(`/admin/categories/${catId}`);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onToggleActive(cat, next) {
    setError('');
    try {
      await api.patch(`/admin/categories/${cat.id}`, { is_active: next });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  // swap with neighbour and persist indexes (only changed rows are PATCHed)
  async function onMove(cat, dir) {
    const i = categories.findIndex((c) => c.id === cat.id);
    const j = i + dir;
    if (j < 0 || j >= categories.length) return;
    const list = [...categories];
    [list[i], list[j]] = [list[j], list[i]];
    setError('');
    try {
      await Promise.all(
        list
          .map((c, idx) => (c.sort !== idx ? api.patch(`/admin/categories/${c.id}`, { sort: idx }) : null))
          .filter(Boolean)
      );
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border mb-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <form onSubmit={onAdd} className="flex flex-col gap-2">
        <input className={field} style={fieldStyle} placeholder="Ad (TR)" value={nameTr} onChange={(e) => setNameTr(e.target.value)} required />
        <input className={field} style={fieldStyle} placeholder="Ad (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
        <button type="submit" className="px-4 py-2 rounded-lg font-semibold self-start" style={{ background: 'var(--gold)', color: '#fff' }}>
          Kategori ekle
        </button>
      </form>
      {error && <span className="text-sm" style={{ color: '#ef6b6b' }}>{error}</span>}
      <ul className="flex flex-col gap-1">
        {categories.map((c, idx) => {
          const active = c.is_active === 1;
          const arrow = 'w-6 h-5 flex items-center justify-center text-[10px] leading-none disabled:opacity-25';
          return (
            <li key={c.id} className="flex items-center justify-between gap-2 text-sm" style={{ color: 'var(--text)', opacity: active ? 1 : 0.55 }}>
              <span className="flex items-center gap-1 min-w-0">
                <span className="flex flex-col -my-1" style={{ color: 'var(--muted)' }}>
                  <button className={arrow} onClick={() => onMove(c, -1)} disabled={idx === 0} aria-label="yukarı taşı">▲</button>
                  <button className={arrow} onClick={() => onMove(c, 1)} disabled={idx === categories.length - 1} aria-label="aşağı taşı">▼</button>
                </span>
                <span className="truncate">{c.name_tr} <span style={{ color: 'var(--muted)' }}>({c.id})</span></span>
              </span>
              <span className="flex items-center gap-3">
                <button
                  onClick={() => onToggleActive(c, active ? 0 : 1)}
                  className="text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap"
                  style={{ borderColor: 'var(--border-strong)', color: active ? 'var(--gold)' : 'var(--muted)' }}
                >
                  {active ? 'Aktif' : 'Pasif'}
                </button>
                <button onClick={() => onDelete(c.id)} style={{ color: '#ef6b6b' }} className="text-[12px]">Sil</button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
