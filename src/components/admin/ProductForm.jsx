import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import ImageUploader from './ImageUploader';

const empty = {
  category_id: '', name_tr: '', name_en: '', name_ar: '', name_ru: '',
  desc_tr: '', desc_en: '', desc_ar: '', desc_ru: '',
  price: '', kcal: '', is_market_price: 0, is_available: 1, is_hidden: 0, popular: 0, chef: 0, diet: [],
};

const listToText = (a) => (Array.isArray(a) ? a.join(', ') : '');
const textToList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

// porsiyon serbest metin olarak saklanır ("350 gr", "6 adet", "35 cl").
// Formda miktar + birim olarak düzenlenir.
const PORTION_UNITS = ['gr', 'adet', 'cl', 'porsiyon'];
const parsePortion = (p) => {
  if (!p) return { amount: '', unit: 'gr' };
  const m = String(p).match(/^\s*([\d.,]+)\s*(.*)$/);
  if (m && PORTION_UNITS.includes(m[2].trim())) return { amount: m[1], unit: m[2].trim() };
  if (m && m[2].trim() === '') return { amount: m[1], unit: 'gr' };
  return { amount: String(p), unit: 'gr' }; // beklenmedik biçim: ham değeri koru
};
const composePortion = (amount, unit) => {
  const a = String(amount ?? '').trim();
  return a ? `${a} ${unit}` : null;
};

const labelStyle = { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 };
const inputStyle = {
  width: '100%', height: 46, padding: '0 14px', background: '#FFFFFF',
  border: '1px solid rgba(22,41,61,0.22)', borderRadius: 12, color: 'var(--text)', fontSize: 14.5,
};
const textareaStyle = {
  width: '100%', padding: '11px 14px', background: '#FFFFFF',
  border: '1px solid rgba(22,41,61,0.22)', borderRadius: 12, color: 'var(--text)', fontSize: 14.5,
  lineHeight: 1.5, resize: 'vertical',
};
const smallHintStyle = { fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 };

function Chip({ active, onClick, children, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        minHeight: 42, padding: '0 15px',
        background: active ? 'var(--gold)' : 'transparent',
        color: active ? '#081726' : 'var(--muted-2)',
        border: `1px solid ${active ? 'var(--gold)' : 'rgba(22,41,61,0.25)'}`,
        borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease',
      }}
    >
      {children}
    </button>
  );
}

function Switch({ on, onClick, label, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{hint}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onClick}
        style={{
          width: 46, height: 26, borderRadius: 999, border: 'none',
          background: on ? 'var(--gold)' : 'rgba(22,41,61,0.20)', position: 'relative', cursor: 'pointer',
          flex: '0 0 auto', transition: 'background 0.2s ease',
        }}
      >
        <span
          style={{
            position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: '50%',
            background: '#FFFDF6', boxShadow: '0 1px 3px rgba(10,31,53,0.35)',
            transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s ease',
          }}
        />
      </button>
    </div>
  );
}

export default function ProductForm({ product, categories, onSaved, onCancel, onDeleted }) {
  const [form, setForm] = useState(() => ({
    ...empty,
    ...product,
    diet: product?.diet ?? [],
    is_hidden: product?.is_hidden ?? 0,
    // ingredient/allergen lists edited as comma-separated text
    ing_tr: listToText(product?.ing_tr),
    ing_en: listToText(product?.ing_en),
    ing_ar: listToText(product?.ing_ar),
    ing_ru: listToText(product?.ing_ru),
    alg_tr: listToText(product?.alg_tr),
    alg_en: listToText(product?.alg_en),
    alg_ar: listToText(product?.alg_ar),
    alg_ru: listToText(product?.alg_ru),
  }));
  const [saved, setSaved] = useState(product ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [portion, setPortion] = useState(() => parsePortion(product?.portion));
  const [w, setW] = useState(window.innerWidth);
  // porsiyon varyantları: fiyat düzenleme kolaylığı için string tutulur
  const [variants, setVariants] = useState(() =>
    (product?.variants ?? []).map((v) => ({
      name_tr: v.name_tr ?? '', name_en: v.name_en ?? '',
      name_ar: v.name_ar ?? '', name_ru: v.name_ru ?? '',
      price: v.price == null ? '' : String(v.price),
    }))
  );
  const setVariant = (i, k, val) => setVariants((vs) => vs.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  const addVariant = () => setVariants((vs) => [...vs, { name_tr: '', name_en: '', name_ar: '', name_ru: '', price: '' }]);
  const removeVariant = (i) => setVariants((vs) => vs.filter((_, j) => j !== i));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDiet = (d) =>
    setForm((f) => ({ ...f, diet: f.diet.includes(d) ? f.diet.filter((x) => x !== d) : [...f.diet, d] }));

  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = w < 780;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel]);

  useEffect(() => {
    if (!confirmDel) return;
    const t = setTimeout(() => setConfirmDel(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDel]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setError('');

    // varyantlar: tamamen boş satırlar atılır; yarım doldurulmuş satır hatadır.
    // (backend kuralı: name_tr + name_en dolu, price ≥ 0; AR/RU isteğe bağlı)
    const cleanVariants = [];
    for (const v of variants) {
      const nt = v.name_tr.trim();
      const ne = v.name_en.trim();
      const pr = String(v.price).trim();
      if (!nt && !ne && pr === '') continue;
      const price = Number(pr.replace(',', '.'));
      if (!nt || !ne || !Number.isFinite(price) || price < 0) {
        setError('Varyant satırlarını tamamlayın (TR + EN ad ve fiyat ≥ 0).');
        setBusy(false);
        return;
      }
      cleanVariants.push({ name_tr: nt, name_en: ne, name_ar: v.name_ar.trim(), name_ru: v.name_ru.trim(), price });
    }

    const payload = {
      ...form,
      // varyant varsa tekil fiyat kullanılmaz (menüde aralık gösterilir)
      price: form.is_market_price || cleanVariants.length
        ? null
        : (form.price === '' ? null : Number(form.price)),
      variants: cleanVariants,
      kcal: form.kcal === '' || form.kcal == null ? null : Number(form.kcal),
      portion: composePortion(portion.amount, portion.unit),
      ing_tr: textToList(form.ing_tr),
      ing_en: textToList(form.ing_en),
      ing_ar: textToList(form.ing_ar),
      ing_ru: textToList(form.ing_ru),
      alg_tr: textToList(form.alg_tr),
      alg_en: textToList(form.alg_en),
      alg_ar: textToList(form.alg_ar),
      alg_ru: textToList(form.alg_ru),
      is_hidden: form.is_hidden ? 1 : 0,
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

  async function onDeleteClick() {
    if (!saved?.id) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    setError('');
    try {
      await api.del(`/admin/products/${saved.id}`);
      onDeleted(saved.id);
    } catch (err) {
      setError(err.message);
      setConfirmDel(false);
    } finally {
      setBusy(false);
    }
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
        onClick={onCancel}
        className="yg-anim-overlay"
        style={{ position: 'absolute', inset: 0, background: 'rgba(5,14,25,0.55)' }}
      />
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        style={{
          ...dialogStyle,
          overflowY: 'auto',
          background: 'var(--card-2, #FDFAF2)',
          boxShadow: '0 -16px 48px rgba(4,12,22,0.35)',
        }}
      >
        <div style={{ padding: '20px 22px 30px', display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, flex: 1, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 25, fontWeight: 600, color: 'var(--text)' }}>
              {saved?.id ? 'Ürün Düzenle' : 'Yeni Ürün'}
            </h3>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Kapat"
              style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'rgba(22,41,61,0.06)',
                color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Ürün Adı (TR) *</label>
            <input style={inputStyle} placeholder="ör. Izgara Levrek" value={form.name_tr} onChange={(e) => set('name_tr', e.target.value)} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Ürün Adı (EN) *</label>
            <input style={inputStyle} placeholder="e.g. Grilled Sea Bass" value={form.name_en} onChange={(e) => set('name_en', e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <label style={labelStyle}>Kategori</label>
              <select style={inputStyle} value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required>
                <option value="">Kategori seç…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_tr}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <label style={labelStyle}>Porsiyon</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inputStyle, minWidth: 0 }} type="number" min="0" step="any" placeholder="örn. 300" value={portion.amount} onChange={(e) => setPortion((p) => ({ ...p, amount: e.target.value }))} />
                <select style={{ ...inputStyle, width: 96, flex: '0 0 auto' }} value={portion.unit} onChange={(e) => setPortion((p) => ({ ...p, unit: e.target.value }))}>
                  {PORTION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Açıklama (TR)</label>
            <textarea style={textareaStyle} rows={2} placeholder="Menüde ürünün altında görünür." value={form.desc_tr} onChange={(e) => set('desc_tr', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Açıklama (EN)</label>
            <textarea style={textareaStyle} rows={2} placeholder="Shown under the item on the menu." value={form.desc_en} onChange={(e) => set('desc_en', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>İçindekiler / Alerjenler</label>
            <span style={smallHintStyle}>Virgülle ayırın (örn. Levrek, Limon, Zeytinyağı). Alerjenler boş = alerjen yok.</span>
            <input style={inputStyle} placeholder="İçindekiler (TR)" value={form.ing_tr} onChange={(e) => set('ing_tr', e.target.value)} />
            <input style={inputStyle} placeholder="Ingredients (EN)" value={form.ing_en} onChange={(e) => set('ing_en', e.target.value)} />
            <input style={inputStyle} placeholder="Alerjenler (TR)" value={form.alg_tr} onChange={(e) => set('alg_tr', e.target.value)} />
            <input style={inputStyle} placeholder="Allergens (EN)" value={form.alg_en} onChange={(e) => set('alg_en', e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Fiyatlandırma</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip active={!form.is_market_price} onClick={() => set('is_market_price', 0)}>Sabit fiyat</Chip>
              <Chip active={!!form.is_market_price} onClick={() => set('is_market_price', 1)}>Piyasa fiyatı</Chip>
            </div>
            {!form.is_market_price ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {variants.length === 0 ? (
                  <div style={{ position: 'relative', minWidth: 0 }}>
                    <input style={{ ...inputStyle, paddingRight: 40 }} type="number" placeholder="Fiyat" aria-label="Fiyat" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12.5, color: 'var(--muted)' }}>TL</span>
                  </div>
                ) : (
                  <span style={{ ...smallHintStyle, alignSelf: 'center' }}>Seçenek fiyatları kullanılıyor</span>
                )}
                <div style={{ position: 'relative', minWidth: 0 }}>
                  <input style={{ ...inputStyle, paddingRight: 48 }} type="number" min="0" placeholder="Kalori" aria-label="Kalori" value={form.kcal ?? ''} onChange={(e) => set('kcal', e.target.value)} />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12.5, color: 'var(--muted)' }}>kcal</span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', minWidth: 0 }}>
                  <input style={{ ...inputStyle, paddingRight: 48 }} type="number" min="0" placeholder="Kalori" aria-label="Kalori" value={form.kcal ?? ''} onChange={(e) => set('kcal', e.target.value)} />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12.5, color: 'var(--muted)' }}>kcal</span>
                </div>
                <span style={smallHintStyle}>Fiyat yerine menüde "Piyasa Fiyatı" rozeti görünür.</span>
              </>
            )}
          </div>

          {!form.is_market_price && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <label style={labelStyle}>Porsiyon Seçenekleri</label>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>girilirse menüde fiyat aralığı gösterilir</span>
              </div>
              {variants.map((v, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8, borderBottom: i < variants.length - 1 ? '1px solid rgba(22,41,61,0.10)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input style={{ ...inputStyle, flex: 1, minWidth: 0, height: 44 }} placeholder="Boyut (TR)" value={v.name_tr} onChange={(e) => setVariant(i, 'name_tr', e.target.value)} />
                    <input style={{ ...inputStyle, flex: 1, minWidth: 0, height: 44 }} placeholder="Size (EN)" value={v.name_en} onChange={(e) => setVariant(i, 'name_en', e.target.value)} />
                    <div style={{ position: 'relative', flex: '0 0 108px' }}>
                      <input style={{ ...inputStyle, height: 44, padding: '0 34px 0 12px', textAlign: 'end' }} type="number" min="0" step="any" placeholder="Fiyat" aria-label="Seçenek fiyatı" value={v.price} onChange={(e) => setVariant(i, 'price', e.target.value)} />
                      <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 11.5, color: 'var(--muted)' }}>TL</span>
                    </div>
                    <button type="button" onClick={() => removeVariant(i)} aria-label="Seçeneği kaldır" style={{ flex: '0 0 auto', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input dir="rtl" style={{ ...inputStyle, flex: 1, minWidth: 0, height: 44 }} placeholder="الحجم (AR) — isteğe bağlı" value={v.name_ar} onChange={(e) => setVariant(i, 'name_ar', e.target.value)} />
                    <input style={{ ...inputStyle, flex: 1, minWidth: 0, height: 44 }} placeholder="Размер (RU) — isteğe bağlı" value={v.name_ru} onChange={(e) => setVariant(i, 'name_ru', e.target.value)} />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addVariant}
                style={{
                  alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 7, minHeight: 40, padding: '0 14px',
                  background: 'none', border: '1.5px dashed rgba(22,41,61,0.28)', borderRadius: 999, color: 'var(--muted-2)',
                  fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 5 V19 M5 12 H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                <span>Seçenek Ekle</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Görseller</label>
            <ImageUploader product={saved} onChange={(p) => { setSaved(p); onSaved(p); }} />
          </div>

          <details>
            <summary style={{ ...labelStyle, cursor: 'pointer', listStyle: 'none' }}>Çeviriler (Arapça / Rusça) ▾</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              <span style={smallHintStyle}>Boş bırakılan alan menüde İngilizce, o da boşsa Türkçe görünür.</span>
              <input dir="rtl" style={inputStyle} placeholder="الاسم (AR)" value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} />
              <input style={inputStyle} placeholder="Название (RU)" value={form.name_ru} onChange={(e) => set('name_ru', e.target.value)} />
              <textarea dir="rtl" style={textareaStyle} rows={2} placeholder="الوصف (AR)" value={form.desc_ar} onChange={(e) => set('desc_ar', e.target.value)} />
              <textarea style={textareaStyle} rows={2} placeholder="Описание (RU)" value={form.desc_ru} onChange={(e) => set('desc_ru', e.target.value)} />
              <span style={smallHintStyle}>İçindekiler / Alerjenler — virgülle ayırın</span>
              <input dir="rtl" style={inputStyle} placeholder="المكوّنات (AR)" value={form.ing_ar} onChange={(e) => set('ing_ar', e.target.value)} />
              <input style={inputStyle} placeholder="Состав (RU)" value={form.ing_ru} onChange={(e) => set('ing_ru', e.target.value)} />
              <input dir="rtl" style={inputStyle} placeholder="مسببات الحساسية (AR)" value={form.alg_ar} onChange={(e) => set('alg_ar', e.target.value)} />
              <input style={inputStyle} placeholder="Аллергены (RU)" value={form.alg_ru} onChange={(e) => set('alg_ru', e.target.value)} />
            </div>
          </details>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Rozetler</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip active={!!form.popular} onClick={() => set('popular', form.popular ? 0 : 1)}>Popüler</Chip>
              <Chip active={!!form.chef} onClick={() => set('chef', form.chef ? 0 : 1)}>Şefin Önerisi</Chip>
              <Chip active={form.diet.includes('gf')} onClick={() => toggleDiet('gf')}>Glutensiz</Chip>
              <Chip active={form.diet.includes('veg')} onClick={() => toggleDiet('veg')}>Vejetaryen</Chip>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(22,41,61,0.10)' }}>
            <div style={{ borderBottom: '1px solid rgba(22,41,61,0.10)' }}>
              <Switch
                on={form.is_available === 0}
                onClick={() => set('is_available', form.is_available === 0 ? 1 : 0)}
                label="Bugün tükendi"
                hint='Menüde soluk ve "Tükendi" rozetiyle görünür.'
              />
            </div>
            <Switch
              on={!!form.is_hidden}
              onClick={() => set('is_hidden', form.is_hidden ? 0 : 1)}
              label="Menüde gizle"
              hint="Ürün menüden tamamen kaldırılır, veriler saklanır."
            />
          </div>

          {error && <span style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</span>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              style={{
                flex: 1, height: 48, background: 'transparent', border: '1px solid rgba(22,41,61,0.30)',
                borderRadius: 999, color: 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                flex: 1.4, height: 48, border: 'none', borderRadius: 999, background: 'var(--gold)',
                color: '#081726', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>

          {saved?.id && (
            <button
              type="button"
              onClick={onDeleteClick}
              disabled={busy}
              style={{
                height: 44,
                background: confirmDel ? 'rgba(163,59,46,0.14)' : 'transparent',
                border: '1px solid rgba(163,59,46,0.45)', borderRadius: 999,
                color: 'var(--danger)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {confirmDel ? 'Silinsin mi? Onayla' : 'Ürünü Sil'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
