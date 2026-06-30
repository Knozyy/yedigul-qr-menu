import { useRef, useState } from 'react';
import { api } from '../../lib/api';

export default function ImageUploader({ product, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!product?.id) {
    return <p className="text-[12px]" style={{ color: 'var(--muted)' }}>Görsel eklemek için önce ürünü kaydedin.</p>;
  }

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const updated = await api.upload(`/admin/products/${product.id}/image`, form);
      onChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    setBusy(true); setError('');
    try {
      const updated = await api.del(`/admin/products/${product.id}/image`);
      onChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {product.image_url ? (
        <img src={product.image_url} alt="" className="w-16 h-16 rounded-lg object-cover border" style={{ borderColor: 'var(--border)' }} />
      ) : (
        <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          Görsel yok
        </div>
      )}
      <div className="flex flex-col gap-1">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} disabled={busy} className="text-[12px]" />
        {product.image_url && (
          <button type="button" onClick={onRemove} disabled={busy} className="text-[12px] text-left" style={{ color: '#ef6b6b' }}>
            Görseli kaldır
          </button>
        )}
        {error && <span className="text-[11px]" style={{ color: '#ef6b6b' }}>{error}</span>}
      </div>
    </div>
  );
}
