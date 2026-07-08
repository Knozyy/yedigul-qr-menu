import { useRef, useState } from 'react';
import { api } from '../../lib/api';

const MAX = 6; // backend MAX_IMAGES ile aynı

// Ürün görsel galerisi: 6'ya kadar görsel. İlk görsel kapaktır (menüde thumbnail).
// Backend: POST /products/:id/images (ekle), PUT /products/:id/images (sırala/çıkar).
export default function ImageUploader({ product, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!product?.id) {
    return <p className="text-[12px]" style={{ color: 'var(--muted)' }}>Görsel eklemek için önce ürünü kaydedin.</p>;
  }

  const images = product.images ?? [];

  async function run(fn, resetInput = false) {
    setBusy(true); setError('');
    try {
      const updated = await fn();
      onChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (resetInput && inputRef.current) inputRef.current.value = '';
    }
  }

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    await run(() => api.upload(`/admin/products/${product.id}/images`, form), true);
  }

  const saveOrder = (next) => run(() => api.put(`/admin/products/${product.id}/images`, { images: next }));
  const removeAt = (i) => saveOrder(images.filter((_, idx) => idx !== i));
  const makeCover = (i) => saveOrder([images[i], ...images.filter((_, idx) => idx !== i)]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {images.length === 0 && (
          <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            Görsel yok
          </div>
        )}
        {images.map((url, i) => (
          <div key={url} className="relative w-16 h-16">
            <img
              src={url}
              alt=""
              className="w-16 h-16 rounded-lg object-cover border"
              style={{ borderColor: i === 0 ? 'var(--gold)' : 'var(--border)' }}
            />
            {i === 0 && (
              <span className="absolute -top-1 -left-1 px-1 rounded text-[8px] font-semibold" style={{ background: 'var(--gold)', color: '#fff' }}>
                Kapak
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              disabled={busy}
              title="Sil"
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[11px] leading-none flex items-center justify-center"
              style={{ background: '#ef6b6b', color: '#fff' }}
            >
              ×
            </button>
            {i !== 0 && (
              <button
                type="button"
                onClick={() => makeCover(i)}
                disabled={busy}
                className="absolute bottom-0 inset-x-0 text-[8px] py-0.5 rounded-b-lg"
                style={{ background: 'rgba(0,0,0,.55)', color: '#fff' }}
              >
                Kapak yap
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {images.length < MAX ? (
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} disabled={busy} className="text-[12px]" />
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>En çok {MAX} görsel eklenebilir.</span>
        )}
        {error && <span className="text-[11px]" style={{ color: '#ef6b6b' }}>{error}</span>}
      </div>
    </div>
  );
}
