import { useEffect, useState } from 'react';
import Badges from './Badges';

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

  const gallery = sheet.images && sheet.images.length ? sheet.images : sheet.image ? [sheet.image] : [];
  const hero = gallery[Math.min(imgIdx, gallery.length - 1)] || sheet.placeholderHero;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        onClick={onClose}
        className="yg-anim-overlay absolute inset-0"
        style={{ background: 'rgba(5,14,25,0.55)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="yg-anim-sheet absolute left-1/2 bottom-0 w-full max-w-[560px]"
        style={{ boxShadow: '0 -16px 48px rgba(4,12,22,0.35)', borderRadius: '24px 24px 0 0' }}
      >
        <div
          className="yg-scroll max-h-[88vh] overflow-y-auto"
          style={{ background: 'var(--sheet-bg)', color: 'var(--text)', borderRadius: '24px 24px 0 0' }}
        >
          <div className="sticky top-0 z-[2] flex justify-center pt-2.5 pb-1.5">
            <button
              onClick={onClose}
              aria-label={ui.close}
              className="w-11 h-[22px] flex items-center justify-center bg-transparent border-none cursor-pointer p-0"
            >
              <span className="w-11 h-[5px] rounded-full" style={{ background: 'var(--faint-strong)' }} />
            </button>
            <button
              onClick={onClose}
              aria-label={ui.close}
              className="absolute top-3 w-11 h-11 rounded-full border-none flex items-center justify-center cursor-pointer"
              style={{ insetInlineEnd: 12, background: 'var(--scrim-btn)', color: 'var(--text)' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="px-5 pt-1 pb-9 flex flex-col gap-4">
            <div
              role="img"
              aria-label={sheet.name}
              className="w-full h-[216px] rounded-[14px]"
              style={{ backgroundImage: `url('${hero}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />

            {gallery.length > 1 && (
              <div className="yg-scroll flex gap-2 overflow-x-auto -mt-1.5">
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setImgIdx(i)}
                    aria-label={`${sheet.name} ${i + 1}`}
                    className="flex-none w-14 h-14 rounded-xl overflow-hidden cursor-pointer p-0"
                    style={{
                      border: `2px solid ${i === Math.min(imgIdx, gallery.length - 1) ? 'var(--accent)' : 'var(--faint)'}`,
                    }}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0 flex flex-col gap-[9px]">
                <Badges item={sheet} ui={ui} />
                <h2 className="m-0 font-outfit text-[29px] font-semibold leading-[1.12]">{sheet.name}</h2>
                {(sheet.kcalText || sheet.portion) && (
                  <div className="flex gap-2 flex-wrap text-[12.5px]" style={{ color: 'var(--muted)' }}>
                    {sheet.kcalText && (
                      <span className="rounded-full px-[11px] py-[4.5px]" style={{ border: '1px solid var(--faint)' }}>
                        {sheet.kcalText}
                      </span>
                    )}
                    {sheet.portion && (
                      <span className="rounded-full px-[11px] py-[4.5px]" style={{ border: '1px solid var(--faint)' }}>
                        {sheet.portion}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => onToggleFav(sheet.id)}
                aria-label="Favori"
                aria-pressed={isFav}
                className="flex-none w-12 h-12 rounded-full flex items-center justify-center bg-transparent cursor-pointer"
                style={{ border: '1px solid var(--faint)', color: isFav ? 'var(--accent)' : 'var(--muted2)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 20.3 C6.4 15.6 3.5 12.4 3.5 9 C3.5 6.4 5.5 4.5 8 4.5 C9.6 4.5 11.1 5.3 12 6.7 C12.9 5.3 14.4 4.5 16 4.5 C18.5 4.5 20.5 6.4 20.5 9 C20.5 12.4 17.6 15.6 12 20.3 Z"
                    fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"
                  />
                </svg>
              </button>
            </div>

            {!sheet.isMarket && (
              <div className="text-[22px] font-semibold" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                {sheet.priceText}
              </div>
            )}

            {sheet.isMarket && (
              <div
                className="flex gap-[11px] items-start rounded-[14px] px-[15px] py-[13px]"
                style={{ border: '1px solid var(--ann-border)', background: 'var(--ann-bg)' }}
              >
                <svg width="21" height="21" viewBox="0 0 24 24" className="flex-none mt-px" style={{ color: 'var(--accent-text)' }} aria-hidden="true">
                  <path
                    d="M2.5 12 C5.5 8.2 11 7 15.2 9.6 C16.6 10.5 17.8 11.3 19.5 12 C17.8 12.7 16.6 13.5 15.2 14.4 C11 17 5.5 15.8 2.5 12 Z M19.5 12 L22.5 9.2 M19.5 12 L22.5 14.8"
                    fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
                <div className="flex flex-col gap-[3px]">
                  <span className="text-[11px] font-semibold tracking-[1.5px] uppercase" style={{ color: 'var(--accent-text)' }}>
                    {ui.market}
                  </span>
                  <p className="m-0 text-[13.5px] leading-[1.5]" style={{ color: 'var(--text)' }}>
                    {ui.marketNote}
                  </p>
                </div>
              </div>
            )}

            {sheet.desc && (
              <p className="m-0 text-[15px] leading-[1.65]" style={{ color: 'var(--muted)' }}>
                {sheet.desc}
              </p>
            )}

            {sheet.variants.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <h4 className="m-0 mb-1.5 text-[11.5px] tracking-[2px] uppercase font-semibold" style={{ color: 'var(--muted2)' }}>
                  {ui.options}
                </h4>
                {sheet.variants.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-baseline gap-2.5 py-[11px] text-[15px]"
                    style={{ borderBottom: '1px solid var(--faint)' }}
                  >
                    <span>{v.name}</span>
                    <span className="flex-1 self-end mb-1" style={{ borderBottom: '1px dotted var(--faint-strong)' }} />
                    <span className="font-semibold whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {v.priceText}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {sheet.ingredients.length > 0 && (
              <div>
                <h4 className="m-0 mb-2 text-[11.5px] tracking-[2px] uppercase font-semibold" style={{ color: 'var(--muted2)' }}>
                  {ui.ingredients}
                </h4>
                <div className="flex gap-1.5 flex-wrap">
                  {sheet.ingredients.map((ing) => (
                    <span key={ing} className="rounded-full px-3 py-[5.5px] text-[13px]" style={{ background: 'var(--chip-soft)' }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="m-0 mb-1.5 text-[11.5px] tracking-[2px] uppercase font-semibold" style={{ color: 'var(--muted2)' }}>
                {ui.allergens}
              </h4>
              <p className="m-0 text-[13.5px] leading-[1.5]" style={{ color: 'var(--muted)' }}>
                {sheet.allergens}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
