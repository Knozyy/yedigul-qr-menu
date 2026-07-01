import ProductCard from './ProductCard';

export default function ProductList({
  items,
  title,
  countLabel,
  emptyLabel,
  onItemClick,
  favorites,
  onToggleFav,
}) {
  return (
    <main className="flex-1 px-5 pt-1 pb-9 flex flex-col gap-[13px]">
      {title && items.length > 0 && (
        <div className="flex items-center gap-3 my-1.5">
          <span className="font-outfit text-[17px] font-semibold tracking-[.01em]" style={{ color: 'var(--text)' }}>
            {title}
          </span>
          <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          {countLabel && (
            <span className="font-inter text-[11px]" style={{ color: 'var(--muted)' }}>
              {countLabel}
            </span>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-[13px] lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item.id)}
              isFav={favorites.includes(item.id)}
              onToggleFav={onToggleFav}
            />
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 px-5 font-inter text-sm" style={{ color: 'var(--muted)' }}>
          {emptyLabel}
        </div>
      )}
    </main>
  );
}
