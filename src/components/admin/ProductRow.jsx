export default function ProductRow({ product, onToggleAvailable, onEdit, onMove, isFirst, isLast }) {
  const priceLabel = product.is_market_price ? 'Piyasa Fiyatı' : `${product.price ?? '—'} TL`;
  const active = product.is_available === 1;
  const arrow = 'w-6 h-5 flex items-center justify-center text-[10px] leading-none disabled:opacity-25';
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', opacity: active ? 1 : 0.55 }}
    >
      <div className="flex flex-col -my-1" style={{ color: 'var(--muted)' }}>
        <button className={arrow} onClick={() => onMove(product, -1)} disabled={isFirst} aria-label="yukarı taşı">▲</button>
        <button className={arrow} onClick={() => onMove(product, 1)} disabled={isLast} aria-label="aşağı taşı">▼</button>
      </div>
      {product.image_url ? (
        <img
          src={product.image_url}
          alt=""
          className="flex-none w-10 h-10 rounded-lg object-cover border"
          style={{ borderColor: 'var(--border)' }}
          loading="lazy"
        />
      ) : (
        <div
          className="flex-none w-10 h-10 rounded-lg border"
          style={{
            background: 'repeating-linear-gradient(135deg, var(--thumb-a) 0 5px, var(--thumb-b) 5px 10px)',
            borderColor: 'var(--border)',
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-outfit text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
          {product.name_tr}
        </div>
        <div className="text-[12px]" style={{ color: 'var(--gold)' }}>{priceLabel}</div>
      </div>
      <button
        onClick={() => onToggleAvailable(product, active ? 0 : 1)}
        className="text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap"
        style={{ borderColor: 'var(--border-strong)', color: active ? 'var(--gold)' : 'var(--muted)' }}
      >
        {active ? 'Aktif' : 'Pasif'}
      </button>
      <button
        onClick={() => onEdit(product)}
        className="text-[12px] px-3 py-1.5 rounded-lg font-medium"
        style={{ background: 'var(--gold-tint)', color: 'var(--gold)' }}
      >
        Düzenle
      </button>
    </div>
  );
}
