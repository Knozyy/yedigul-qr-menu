import Heart from './Heart';

function TagChip({ kind, label }) {
  const popular = kind === 'popular';
  return (
    <span
      className="inline-flex items-center gap-[3px] font-inter text-[10px] font-bold tracking-[.04em] px-2 py-[3px] rounded-full"
      style={
        popular
          ? { background: 'var(--gold)', color: '#fff' }
          : { background: 'var(--navy-2)', color: '#fff' }
      }
    >
      {popular && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.95 6.13L21.5 9l-4.75 4.43L18 20l-6-3.27L6 20l1.25-6.57L2.5 9l6.55-.87z" />
        </svg>
      )}
      {label}
    </span>
  );
}

export default function ProductCard({ item, onClick, isFav, onToggleFav }) {
  return (
    <div
      onClick={onClick}
      className="flex gap-3.5 p-[13px] rounded-[18px] border cursor-pointer transition-transform duration-150 ease-out active:scale-[.984]"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 3px 14px var(--shadow)' }}
    >
      <div className="relative flex-none w-[72px] h-[72px]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full rounded-[13px] object-cover border"
            style={{ borderColor: 'var(--border)' }}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full rounded-[13px] flex items-center justify-center text-center p-1 border"
            style={{
              background:
                'repeating-linear-gradient(135deg, var(--thumb-a) 0 6px, var(--thumb-b) 6px 12px)',
              borderColor: 'var(--border)',
            }}
          >
            <span className="font-outfit text-[8.5px] font-semibold tracking-[.18em]" style={{ color: 'var(--thumb-ink)' }}>
              {item.thumb}
            </span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(item.id);
          }}
          aria-label="favorite"
          aria-pressed={isFav}
          className="absolute -top-1.5 -right-1.5 w-[26px] h-[26px] rounded-full flex items-center justify-center cursor-pointer p-0 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 2px 6px var(--shadow)' }}
        >
          <Heart filled={isFav} size={14} color={isFav ? 'var(--gold)' : 'var(--muted)'} />
        </button>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-baseline justify-between gap-2.5">
          <span className="font-outfit text-[19px] font-semibold leading-[1.1] tracking-[.005em]" style={{ color: 'var(--text)' }}>
            {item.name}
          </span>
          <span className="flex-none flex flex-col items-end gap-[2px]">
            {item.isMarket ? (
              <span
                className="font-inter text-[9px] font-semibold uppercase tracking-[.1em] px-[9px] py-1 rounded-full border whitespace-nowrap text-right"
                style={{ color: 'var(--gold)', background: 'var(--gold-tint)', borderColor: 'var(--gold-soft)' }}
              >
                {item.priceText}
              </span>
            ) : (
              <span className="font-outfit text-[20px] font-semibold whitespace-nowrap leading-none" style={{ color: 'var(--gold)' }}>
                {item.priceText}
              </span>
            )}
            {item.portion && (
              <span className="font-inter text-[10.5px] font-medium whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                {item.portion}
              </span>
            )}
          </span>
        </div>

        <span className="font-inter text-[12.5px] leading-[1.5] mt-[3px]" style={{ color: 'var(--muted)', textWrap: 'pretty' }}>
          {item.desc}
          {item.kcalText && (
            <span className="whitespace-nowrap"> · {item.kcalText}</span>
          )}
        </span>

        {(item.tags.length > 0 || item.badges.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {item.tags.map((t) => (
              <TagChip key={t.kind} kind={t.kind} label={t.label} />
            ))}
            {item.badges.map((b) => (
              <span
                key={b}
                className="font-inter text-[10px] font-semibold tracking-[.04em] px-2 py-[3px] rounded-full"
                style={{ background: 'var(--chip)', color: 'var(--navy-2)' }}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
