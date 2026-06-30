import { useState } from 'react';
import { api } from '../../lib/api';
import ImageUploader from './ImageUploader';

const empty = {
  category_id: '', name_tr: '', name_en: '', desc_tr: '', desc_en: '',
  price: '', is_market_price: 0, is_available: 1, popular: 0, chef: 0, diet: [],
};

export default function ProductForm({ product, categories, onSaved, onCancel, onDeleted }) {
  const [form, setForm] = useState(() => ({ ...empty, ...product, diet: product?.diet ?? [] }));
  const [saved, setSaved] = useState(product ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDiet = (d) =>
    setForm((f) => ({ ...f, diet: f.diet.includes(d) ? f.diet.filter((x) => x !== d) : [...f.diet, d] }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const payload = {
      ...form,
      price: form.is_market_price ? null : (form.price === '' ? null : Number(form.price)),
    };
    try {
      const res = saved?.id
        ? await api.patch(`/admin/products/${saved.id}`, payload)
        : await api.post('/admin/products', payload);
      setSaved(res);
      onSaved(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!saved?.id || !confirm('Ürün silinsin mi?')) return;
    setBusy(true);
    setError('');
    try {
      await api.del(`/admin/products/${saved.id}`);
      onDeleted(saved.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none w-full';
  const fieldStyle = { borderColor: 'var(--border-strong)', color: 'var(--text)' };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4 rounded-xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <select className={field} style={fieldStyle} value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required>
        <option value="">Kategori seç…</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name_tr}</option>)}
      </select>
      <input className={field} style={fieldStyle} placeholder="Ad (TR)" value={form.name_tr} onChange={(e) => set('name_tr', e.target.value)} required />
      <input className={field} style={fieldStyle} placeholder="Ad (EN)" value={form.name_en} onChange={(e) => set('name_en', e.target.value)} required />
      <textarea className={field} style={fieldStyle} placeholder="Açıklama (TR)" value={form.desc_tr} onChange={(e) => set('desc_tr', e.target.value)} />
      <textarea className={field} style={fieldStyle} placeholder="Açıklama (EN)" value={form.desc_en} onChange={(e) => set('desc_en', e.target.value)} />
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
        <input type="checkbox" checked={!!form.is_market_price} onChange={(e) => set('is_market_price', e.target.checked ? 1 : 0)} />
        Piyasa Fiyatı
      </label>
      {!form.is_market_price && (
        <input className={field} style={fieldStyle} type="number" placeholder="Fiyat (TL)" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} />
      )}
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
        <input type="checkbox" checked={form.is_available === 1} onChange={(e) => set('is_available', e.target.checked ? 1 : 0)} />
        Menüde görünür (aktif)
      </label>
      <div className="flex gap-4 text-sm" style={{ color: 'var(--text)' }}>
        <label className="flex items-center gap-1"><input type="checkbox" checked={form.diet.includes('gf')} onChange={() => toggleDiet('gf')} /> Glütensiz</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={form.diet.includes('veg')} onChange={() => toggleDiet('veg')} /> Vejetaryen</label>
      </div>
      <div className="flex gap-4 text-sm" style={{ color: 'var(--text)' }}>
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.popular} onChange={(e) => set('popular', e.target.checked ? 1 : 0)} /> Popüler</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.chef} onChange={(e) => set('chef', e.target.checked ? 1 : 0)} /> Şef önerisi</label>
      </div>

      <ImageUploader product={saved} onChange={(p) => { setSaved(p); onSaved(p); }} />

      {error && <span className="text-sm" style={{ color: '#ef6b6b' }}>{error}</span>}
      <div className="flex gap-2 mt-1">
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--gold)', color: '#fff' }}>
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }}>
          Kapat
        </button>
        {saved?.id && (
          <button type="button" onClick={onDelete} className="px-4 py-2 rounded-lg ml-auto" style={{ color: '#ef6b6b' }}>
            Sil
          </button>
        )}
      </div>
    </form>
  );
}
