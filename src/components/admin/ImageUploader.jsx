import { useRef, useState } from 'react';
import { api } from '../../lib/api';

const MAX = 6; // backend MAX_IMAGES ile aynı

// Ürün görsel galerisi: 6'ya kadar görsel, çoklu seçilebilir. İlk görsel kapaktır.
// Backend: POST /products/:id/images (ekle), PUT /products/:id/images (sırala/çıkar).
export default function ImageUploader({ product, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!product?.id) {
    return <p className="text-[12px]" style={{ color: 'var(--muted)' }}>Görsel eklemek için önce ürünü kaydedin.</p>;
  }

  const images = product.images ?? [];

  // Çoklu dosya: sırayla yükle, en sonda tek onChange (tek toast/reload).
  async function onPick(e) {
    const files = Array.from(e.target.files || []);
    if (inputRef.current) inputRef.current.value = '';
    if (!files.length) return;
    setBusy(true); setError('');
    let updated = null;
    let count = images.length;
    try {
      for (const file of files) {
        if (count >= MAX) { setError(`En çok ${MAX} görsel — fazlası eklenmedi.`); break; }
        const form = new FormData();
        form.append('image', file);
        updated = await api.upload(`/admin/products/${product.id}/images`, form);
        count++;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (updated) onChange(updated);
      setBusy(false);
    }
  }

  const saveOrder = async (next) => {
    setBusy(true); setError('');
    try { onChange(await api.put(`/admin/products/${product.id}/images`, { images: next })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const removeAt = (i) => saveOrder(images.filter((_, idx) => idx !== i));
  const makeCover = (i) => saveOrder([images[i], ...images.filter((_, idx) => idx !== i)]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
          İlk görsel <b style={{ color: 'var(--gold)' }}>kapak</b>tır. Değiştirmek için başka görselde <b style={{ color: 'var(--gold)' }}>“Kapak yap”</b>a dokun.
        </span>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{images.length}/{MAX}</span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {images.map((url, i) => (
          <div key={url} className="relative w-20 h-20">
            <img
              src={url}
              alt=""
              className="w-20 h-20 rounded-lg object-cover border-2"
              style={{ borderColor: i === 0 ? 'var(--gold)' : 'var(--border)' }}
            />
            {i === 0 && (
              <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: 'var(--gold)', color: '#fff' }}>
                ★ Kapak
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              disabled={busy}
              title="Sil"
              aria-label="Görseli sil"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[13px] leading-none flex items-center justify-center shadow"
              style={{ background: '#ef6b6b', color: '#fff' }}
            >
              ×
            </button>
            {i !== 0 && (
              <button
                type="button"
                onClick={() => makeCover(i)}
                disabled={busy}
                title="Bu görseli kapak yap"
                className="absolute bottom-0 inset-x-0 text-[10px] font-semibold py-1 rounded-b-md"
                style={{ background: 'var(--gold)', color: '#fff' }}
              >
                ★ Kapak yap
              </button>
            )}
          </div>
        ))}

        {images.length < MAX && (
          <label
            className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 text-[11px]"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--muted)', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            <span className="text-[22px] leading-none">＋</span>
            <span>{busy ? 'Yükleniyor…' : 'Foto ekle'}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={onPick}
              disabled={busy}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <span className="text-[11px]" style={{ color: '#ef6b6b' }}>{error}</span>}
    </div>
  );
}
