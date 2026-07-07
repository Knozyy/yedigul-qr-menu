import { useEffect, useState } from 'react';
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
  // Çoklu görselde seçili kare; ürün değişince kapağa dön.
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [sheet?.id]);

  // Esc ile kapat + panel açıkken arka planı kaydırmayı kilitle.
  useEffect(() => {
    if (!sheet) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sheet, onClose]);

  if (!sheet) return null;

  const gallery = sheet.images && sheet.images.length ? sheet.images : (sheet.image ? [sheet.image] : []);
  const mainImage = gallery[Math.min(imgIdx, gallery.length - 1)] || null;

  return (
    <>
      <div
        onClick={onClose}
        className="yg-anim-overlay fixed inset-0 z-[55]"
        style={{ background: 'rgba(8,16,30,.5)', backdropFilter: 'blur(2px)' }}
      />
      <div
        className="yg-anim-sheet fixed left-1/2 bottom-0 w-full max-w-[468px] md:max-w-[560px] z-[60] rounded-t-[26px]"
        style={{ boxShadow: '0 -16px 50px rgba(0,0,0,.32)' }}
      >
        <div
          className="yg-scroll max-h-[86vh] overflow-y-auto rounded-t-[26px]"
          style={{ background: 'var(--surface)' }}
        >
          <div className="sticky top-0 z-10 flex items-center justify-center pt-[11px] pb-1" style={{ background: 'var(--surface)' }}>
            <button
              onClick={onClose}
              aria-label={ui.close || 'Kapat'}
              className="absolute left-1/2 -translate-x-1/2 top-[9px] w-[52px] h-[9px] flex items-center justify-center cursor-pointer p-0 bg-transparent border-none"
            >
              <span className="w-[42px] h-[5px] rounded-full" style={{ background: 'var(--border-strong)' }} />
            </button>
            <button
              onClick={onClose}
              aria-label={ui.close || 'Kapat'}
              className="absolute right-3 top-2 w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer p-0 border"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-[22px] pt-1.5 pb-[26px]">
            <div className="relative">
              {mainImage ? (
                <img
                  src={mainImage}
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

            {gallery.length > 1 && (
              <div className="flex gap-2 mt-2.5 overflow-x-auto yg-scroll pb-1">
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setImgIdx(i)}
                    aria-label={`${sheet.name} ${i + 1}`}
                    className="flex-none w-[56px] h-[56px] rounded-[12px] overflow-hidden border-2 cursor-pointer p-0"
                    style={{ borderColor: i === Math.min(imgIdx, gallery.length - 1) ? 'var(--gold)' : 'var(--border)' }}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

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
              <span className="flex-none flex flex-col items-end gap-[3px]">
                {sheet.isMarket ? (
                  <span
                    className="font-inter text-[10px] font-semibold uppercase tracking-[.1em] px-3 py-1.5 rounded-full border whitespace-nowrap text-right"
                    style={{ color: 'var(--gold)', background: 'var(--gold-tint)', borderColor: 'var(--gold-soft)' }}
                  >
                    {sheet.priceText}
                  </span>
                ) : (
                  <span className="font-outfit text-[29px] font-semibold whitespace-nowrap leading-none" style={{ color: 'var(--gold)' }}>
                    {sheet.priceText}
                  </span>
                )}
                {sheet.portion && (
                  <span className="font-inter text-[12px] font-medium whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                    {sheet.portion}
                  </span>
                )}
              </span>
            </div>

            <p className="font-inter text-sm leading-[1.6] mt-3.5" style={{ color: 'var(--muted)', textWrap: 'pretty' }}>
              {sheet.desc}
            </p>

            {sheet.variants && sheet.variants.length > 0 && (
              <div className="mt-4">
                <span className="yg-overline text-[10.5px]" style={{ color: 'var(--gold)' }}>
                  {ui.options}
                </span>
                <div className="mt-2 rounded-2xl border divide-y" style={{ borderColor: 'var(--border)' }}>
                  {sheet.variants.map((v) => (
                    <div
                      key={v.name}
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <span className="font-inter text-[13.5px] font-medium" style={{ color: 'var(--text)' }}>
                        {v.name}
                      </span>
                      <span className="font-outfit text-[16px] font-semibold whitespace-nowrap" style={{ color: 'var(--gold)' }}>
                        {v.price} TL
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
