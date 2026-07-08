function priceText(p) {
  if (p.is_market_price) return 'Piyasa Fiyatı';
  const vs = p.variants || [];
  if (vs.length) {
    const ps = vs.map((v) => v.price);
    const min = Math.min(...ps), max = Math.max(...ps);
    return min === max ? `${min} TL` : `${min}–${max} TL`;
  }
  return `${p.price ?? '—'} TL`;
}

export default function ProductCard({ product, category, onToggleAvailable, onEdit, onMove, onMoveTop, isFirst, isLast, showReorder }) {
  const active = product.is_available === 1;
  const arrow = 'w-6 h-5 flex items-center justify-center text-[10px] leading-none disabled:opacity-25';
  return (
    <div
      className="flex items-center gap-2.5 p-3 rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', opacity: active ? 1 : 0.55 }}
    >
      {showReorder && (
        <div className="flex flex-col -my-1" style={{ color: 'var(--muted)' }}>
          <button className={arrow} onClick={() => onMove(product, -1)} disabled={isFirst} aria-label="yukarı taşı">▲</button>
          <button className={arrow} onClick={() => onMove(product, 1)} disabled={isLast} aria-label="aşağı taşı">▼</button>
        </div>
      )}
      {product.image_url ? (
        <img src={product.image_url} alt="" loading="lazy" className="flex-none w-11 h-11 rounded-lg object-cover border" style={{ borderColor: 'var(--border)' }} />
      ) : (
        <div className="flex-none w-11 h-11 rounded-lg border" style={{ background: 'repeating-linear-gradient(135deg, var(--thumb-a) 0 5px, var(--thumb-b) 5px 10px)', borderColor: 'var(--border)' }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-outfit text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
          {product.name_tr}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {category && (
            <span className="text-[10.5px] px-1.5 py-0.5 rounded" style={{ background: 'var(--gold-tint)', color: 'var(--muted)' }}>{category.name_tr}</span>
          )}
          <span className="text-[12px]" style={{ color: 'var(--gold)' }}>{priceText(product)}</span>
          {product.popular ? <span className="text-[10px]" style={{ color: 'var(--muted)' }}>★ Popüler</span> : null}
          {product.chef ? <span className="text-[10px]" style={{ color: 'var(--muted)' }}>👨‍🍳 Şef</span> : null}
        </div>
      </div>
      {showReorder && !isFirst && (
        <button onClick={() => onMoveTop(product)} className="text-[11px] px-2 py-1 rounded-lg border whitespace-nowrap" style={{ borderColor: 'var(--border-strong)', color: 'var(--muted)' }}>En üste</button>
      )}
      <button
        onClick={() => onToggleAvailable(product, active ? 0 : 1)}
        className="text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap"
        style={{ borderColor: 'var(--border-strong)', color: active ? 'var(--gold)' : 'var(--muted)' }}
      >
        {active ? 'Aktif' : 'Pasif'}
      </button>
      <button onClick={() => onEdit(product)} className="text-[12px] px-3 py-1.5 rounded-lg font-medium" style={{ background: 'var(--gold-tint)', color: 'var(--gold)' }}>
        Düzenle
      </button>
    </div>
  );
}
