import Badges from './Badges';

// Editoryal menü satırı: kart yerine ince ayraç, serif ürün adı ve fiyata
// uzanan noktalı kılavuz çizgisi (klasik basılı menü tipografisi).
export default function ProductCard({ item, ui, onClick, isFav, onToggleFav }) {
  return (
    <article
      onClick={onClick}
      className="flex gap-3 items-start cursor-pointer"
      style={{ borderBottom: '1px solid var(--faint)', padding: '16px 2px' }}
    >
      <img
        src={item.thumb}
        alt={item.name}
        width="72"
        height="72"
        loading="lazy"
        className="w-[72px] h-[72px] rounded-xl object-cover flex-none"
      />

      <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
        <div className="flex items-baseline gap-2">
          <h3
            className="m-0 font-outfit text-[19px] font-semibold leading-[1.25] min-w-0"
            style={{ color: 'var(--text)', overflowWrap: 'break-word' }}
          >
            {item.name}
          </h3>
          <span
            className="flex-1 min-w-[10px] self-end mb-[5px]"
            style={{ borderBottom: '1px dotted var(--faint-strong)' }}
          />
          {item.isMarket ? (
            <span
              className="flex-none text-[10.5px] font-semibold tracking-[1.2px] uppercase px-[9px] py-[5px] rounded-full whitespace-nowrap"
              style={{ border: '1px solid var(--ann-border)', color: 'var(--accent-text)' }}
            >
              {item.priceText}
            </span>
          ) : (
            <span
              className="flex-none text-[16px] font-semibold whitespace-nowrap"
              style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}
            >
              {item.priceText}
            </span>
          )}
        </div>

        <Badges item={item} ui={ui} />

        {item.desc && (
          <p
            className="m-0 text-[13.5px] leading-[1.45]"
            style={{
              color: 'var(--muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.desc}
          </p>
        )}

        {(item.kcalText || item.portion) && (
          <div className="flex gap-2 text-[12px] tracking-[.3px]" style={{ color: 'var(--muted2)' }}>
            {item.kcalText && <span>{item.kcalText}</span>}
            {item.kcalText && item.portion && <span>·</span>}
            {item.portion && <span>{item.portion}</span>}
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav(item.id);
        }}
        aria-label="Favori"
        aria-pressed={isFav}
        className="flex-none w-11 h-11 -mt-1.5 flex items-center justify-center bg-transparent border-none cursor-pointer"
        style={{ marginInlineEnd: -10, color: isFav ? 'var(--accent)' : 'var(--muted2)' }}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.3 C6.4 15.6 3.5 12.4 3.5 9 C3.5 6.4 5.5 4.5 8 4.5 C9.6 4.5 11.1 5.3 12 6.7 C12.9 5.3 14.4 4.5 16 4.5 C18.5 4.5 20.5 6.4 20.5 9 C20.5 12.4 17.6 15.6 12 20.3 Z"
            fill={isFav ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>
    </article>
  );
}
