import Heart from './Heart';

function TagChip({ kind, label }) {
  const popular = kind === 'popular';
  return (
    <span
      className="inline-flex items-center gap-1 font-inter text-[10px] font-bold tracking-[.06em] px-2.5 py-1 rounded-full"
      style={
        popular ? { background: 'var(--gold)', color: '#fff' } : { background: 'var(--navy-2)', color: '#fff' }
      }
    >
      {popular && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.95 6.13L21.5 9l-4.75 4.43L18 20l-6-3.27L6 20l1.25-6.57L2.5 9l6.55-.87z" />
        </svg>
      )}
      {label}
    </span>
  );
}

export default function BottomSheet({ sheet, ui, onClose, isFav, onToggleFav }) {
  if (!sheet) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="yg-anim-overlay fixed inset-0 z-[55]"
        style={{ background: 'rgba(8,16,30,.5)', backdropFilter: 'blur(2px)' }}
      />
      <div
        className="yg-anim-sheet fixed left-1/2 bottom-0 w-full max-w-[468px] lg:max-w-[560px] z-[60] rounded-t-[26px]"
        style={{ boxShadow: '0 -16px 50px rgba(0,0,0,.32)' }}
      >
        <div
          className="yg-scroll max-h-[86vh] overflow-y-auto rounded-t-[26px]"
          style={{ background: 'var(--surface)' }}
        >
          <div className="sticky top-0 flex justify-center pt-[11px] pb-1" style={{ background: 'var(--surface)' }}>
            <span className="w-[42px] h-[5px] rounded-full" style={{ background: 'var(--border-strong)' }} />
          </div>

          <div className="px-[22px] pt-1.5 pb-[26px]">
            <div className="relative">
              {sheet.image ? (
                <img
                  src={sheet.image}
                  alt={sheet.name}
                  className="w-full h-[170px] rounded-[18px] object-cover border"
                  style={{ borderColor: 'var(--border)' }}
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-full h-[170px] rounded-[18px] flex items-center justify-center text-center border"
                  style={{
                    background: 'repeating-linear-gradient(135deg, var(--thumb-a) 0 8px, var(--thumb-b) 8px 16px)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <span className="font-outfit text-[11px] font-semibold tracking-[.22em]" style={{ color: 'var(--thumb-ink)' }}>
                    {sheet.thumb}
                  </span>
                </div>
              )}
              <button
                onClick={() => onToggleFav(sheet.id)}
                aria-label="favorite"
                aria-pressed={isFav}
                className="absolute top-3 right-3 w-[38px] h-[38px] rounded-full flex items-center justify-center cursor-pointer p-0 border transition-transform duration-150 ease-out active:scale-90"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 4px 12px var(--shadow)' }}
              >
                <Heart filled={isFav} size={19} color={isFav ? 'var(--gold)' : 'var(--muted)'} />
              </button>
            </div>

            {sheet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {sheet.tags.map((t) => (
                  <TagChip key={t.kind} kind={t.kind} label={t.label} />
                ))}
              </div>
            )}

            <div className="flex items-start justify-between gap-3.5 mt-4">
              <div className="flex-1 min-w-0">
                <span className="yg-overline block text-[10px]" style={{ color: 'var(--gold)' }}>
                  {sheet.category}
                </span>
                <span className="block font-outfit text-[30px] font-semibold leading-[1.05] mt-[6px]" style={{ color: 'var(--text)' }}>
                  {sheet.name}
                </span>
              </div>
              {sheet.isMarket ? (
                <span
                  className="flex-none font-inter text-[10px] font-semibold uppercase tracking-[.1em] px-3 py-1.5 rounded-full border whitespace-nowrap text-right"
                  style={{ color: 'var(--gold)', background: 'var(--gold-tint)', borderColor: 'var(--gold-soft)' }}
                >
                  {sheet.priceText}
                </span>
              ) : (
                <span className="flex-none font-outfit text-[29px] font-semibold whitespace-nowrap" style={{ color: 'var(--gold)' }}>
                  {sheet.priceText}
                </span>
              )}
            </div>

            <p className="font-inter text-sm leading-[1.6] mt-3.5" style={{ color: 'var(--muted)', textWrap: 'pretty' }}>
              {sheet.desc}
            </p>

            {sheet.kcal != null && (
              <div className="flex items-center gap-2 mt-3">
                <span className="yg-overline text-[10px]" style={{ color: 'var(--gold)' }}>
                  {ui.energy}
                </span>
                <span className="font-inter text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                  {sheet.kcal} kcal
                </span>
              </div>
            )}

            <div className="mt-[22px]">
              <span className="yg-overline text-[10.5px]" style={{ color: 'var(--gold)' }}>
                {ui.ingredients}
              </span>
              <div className="flex flex-wrap gap-2 mt-[11px]">
                {sheet.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="font-inter text-[12.5px] px-3 py-1.5 rounded-full border"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="mt-5 mb-1 flex gap-[11px] px-4 py-3.5 rounded-2xl border"
              style={{ background: 'var(--gold-tint)', borderColor: 'var(--gold-soft)' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-none mt-px"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
              <div className="flex-1">
                <span className="yg-overline block text-[10px]" style={{ color: 'var(--gold)' }}>
                  {ui.allergens}
                </span>
                <span className="block font-inter text-[12.5px] leading-[1.5] mt-[3px]" style={{ color: 'var(--muted)' }}>
                  {sheet.allergens}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
