import { useState } from 'react';
import { api } from '../../lib/api';

export default function CategoryForm({ categories, onChanged }) {
  const [id, setId] = useState('');
  const [nameTr, setNameTr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [error, setError] = useState('');

  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none';
  const fieldStyle = { borderColor: 'var(--border-strong)', color: 'var(--text)' };

  async function onAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/categories', { id: id.trim(), name_tr: nameTr, name_en: nameEn });
      setId(''); setNameTr(''); setNameEn('');
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

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border mb-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <form onSubmit={onAdd} className="flex flex-col gap-2">
        <input className={field} style={fieldStyle} placeholder="ID (örn. wine)" value={id} onChange={(e) => setId(e.target.value)} required />
        <input className={field} style={fieldStyle} placeholder="Ad (TR)" value={nameTr} onChange={(e) => setNameTr(e.target.value)} required />
        <input className={field} style={fieldStyle} placeholder="Ad (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
        <button type="submit" className="px-4 py-2 rounded-lg font-semibold self-start" style={{ background: 'var(--gold)', color: '#fff' }}>
          Kategori ekle
        </button>
      </form>
      {error && <span className="text-sm" style={{ color: '#ef6b6b' }}>{error}</span>}
      <ul className="flex flex-col gap-1">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between text-sm" style={{ color: 'var(--text)' }}>
            <span>{c.name_tr} <span style={{ color: 'var(--muted)' }}>({c.id})</span></span>
            <button onClick={() => onDelete(c.id)} style={{ color: '#ef6b6b' }} className="text-[12px]">Sil</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
