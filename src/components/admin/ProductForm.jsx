import { useState } from 'react';
import { api } from '../../lib/api';
import ImageUploader from './ImageUploader';

const empty = {
  category_id: '', name_tr: '', name_en: '', desc_tr: '', desc_en: '',
  price: '', is_market_price: 0, is_available: 1, popular: 0, chef: 0, diet: [],
};

const listToText = (a) => (Array.isArray(a) ? a.join(', ') : '');
const textToList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function ProductForm({ product, categories, onSaved, onCancel, onDeleted }) {
  const [form, setForm] = useState(() => ({
    ...empty,
    ...product,
    diet: product?.diet ?? [],
    // ingredient/allergen lists edited as comma-separated text
    ing_tr: listToText(product?.ing_tr),
    ing_en: listToText(product?.ing_en),
    alg_tr: listToText(product?.alg_tr),
    alg_en: listToText(product?.alg_en),
  }));
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
      ing_tr: textToList(form.ing_tr),
      ing_en: textToList(form.ing_en),
      alg_tr: textToList(form.alg_tr),
      alg_en: textToList(form.alg_en),
    };
    try {
      const wasExisting = !!saved?.id;
      const res = wasExisting
        ? await api.patch(`/admin/products/${saved.id}`, payload)
        : await api.post('/admin/products', payload);
      setSaved(res);
      onSaved(res);
      // editing an existing product: close back to the list.
      // new product: stay open so an image can be uploaded now that it has an id.
      if (wasExisting) onCancel();
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
  // native select dropdowns render options on an OS surface, so set a solid
  // dark background + light text or the options are invisible in dark mode
  const selectStyle = { borderColor: 'var(--border-strong)', color: 'var(--text)', background: 'var(--surface)' };
  const optionStyle = { background: 'var(--surface)', color: 'var(--text)' };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4 rounded-xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <select className="px-3 py-2 rounded-lg border outline-none w-full" style={selectStyle} value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required>
        <option value="" style={optionStyle}>Kategori seç…</option>
        {categories.map((c) => <option key={c.id} value={c.id} style={optionStyle}>{c.name_tr}</option>)}
      </select>
      <input className={field} style={fieldStyle} placeholder="Ad (TR)" value={form.name_tr} onChange={(e) => set('name_tr', e.target.value)} required />
      <input className={field} style={fieldStyle} placeholder="Ad (EN)" value={form.name_en} onChange={(e) => set('name_en', e.target.value)} required />
      <textarea className={field} style={fieldStyle} placeholder="Açıklama (TR)" value={form.desc_tr} onChange={(e) => set('desc_tr', e.target.value)} />
      <textarea className={field} style={fieldStyle} placeholder="Açıklama (EN)" value={form.desc_en} onChange={(e) => set('desc_en', e.target.value)} />
      <div className="flex flex-col gap-2">
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>İçindekiler — virgülle ayırın (örn. Levrek, Limon, Zeytinyağı)</span>
        <input className={field} style={fieldStyle} placeholder="İçindekiler (TR)" value={form.ing_tr} onChange={(e) => set('ing_tr', e.target.value)} />
        <input className={field} style={fieldStyle} placeholder="Ingredients (EN)" value={form.ing_en} onChange={(e) => set('ing_en', e.target.value)} />
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>Alerjenler — virgülle ayırın (boş = alerjen yok)</span>
        <input className={field} style={fieldStyle} placeholder="Alerjenler (TR)" value={form.alg_tr} onChange={(e) => set('alg_tr', e.target.value)} />
        <input className={field} style={fieldStyle} placeholder="Allergens (EN)" value={form.alg_en} onChange={(e) => set('alg_en', e.target.value)} />
      </div>
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
