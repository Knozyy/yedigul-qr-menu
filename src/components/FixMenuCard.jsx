/**
 * Prix-fixe bloğu.
 *
 * Ürünler açık satırlar hâlinde, aralarında kıl payı çizgiyle akar
 * (ProductCard). Fix menü ise ÇERÇEVELİ bir blok: basılı menülerde paket
 * menünün kutuya alınmasının aynısı. Bu karşıtlık gerçek farkı taşıyor —
 * ürün listedeki bir kalem, fix menü kendi içinde kapalı bir paket.
 *
 * İçerik satırlarında noktalı kılavuz çizgisi KULLANILMAZ: o çizgi "bu
 * kalemin fiyatı şu" demektir, fix menü içeriğinin tek tek fiyatı yoktur.
 */
export default function FixMenuCard({ set, priceText, perPersonLabel }) {
  return (
    <article
      className="yg-fix-menu-card"
    >
      <h3
        className="m-0 font-outfit text-[25px] sm:text-[28px] font-semibold leading-[1.15]"
        style={{ color: 'var(--text)', overflowWrap: 'break-word' }}
      >
        {set.name}
      </h3>

      {set.desc ? (
        <p
          className="mt-2 mb-0 text-[13.5px] leading-[1.6]"
          style={{ color: 'var(--muted2)' }}
        >
          {set.desc}
        </p>
      ) : null}

      <ul className="list-none m-0 mt-5 p-0 flex flex-col gap-[9px]">
        {set.items.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
            className="flex items-baseline gap-3 text-[14.5px] leading-[1.45]"
            style={{ color: 'var(--text)' }}
          >
            <span
              className="flex-none text-[12px] font-semibold pt-[1px]"
              style={{ color: 'var(--accent-text)', fontVariantNumeric: 'tabular-nums', minWidth: 22 }}
            >
              {item.qty}×
            </span>
            <span className="min-w-0" style={{ overflowWrap: 'break-word' }}>{item.name}</span>
          </li>
        ))}
      </ul>

      {priceText ? (
        <div
          className="mt-6 pt-4 flex items-baseline justify-between gap-3"
          style={{ borderTop: '1px solid var(--faint)' }}
        >
          <span
            className="text-[11px] tracking-[1.4px] uppercase"
            style={{ color: 'var(--muted2)' }}
          >
            {perPersonLabel}
          </span>
          <span
            className="font-outfit text-[26px] font-semibold whitespace-nowrap"
            style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}
          >
            {priceText}
          </span>
        </div>
      ) : null}
    </article>
  );
}
