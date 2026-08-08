export default function Badges({ item, ui }) {
  if (!item.popular && !item.chef && !item.gf && !item.veg) return null;
  return (
    <div className="flex gap-1.5 flex-wrap">
      {item.popular && (
        <span
          className="inline-flex items-center gap-1 text-[10.5px] font-semibold tracking-[.8px] uppercase px-2 py-[3.5px] rounded-full"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 L14.9 8.2 L21.5 9 L16.6 13.6 L17.9 20.2 L12 17 L6.1 20.2 L7.4 13.6 L2.5 9 L9.1 8.2 Z" fill="currentColor" />
          </svg>
          {ui.popular}
        </span>
      )}
      {item.chef && (
        <span
          className="text-[10.5px] font-semibold tracking-[.8px] uppercase px-2 py-[3.5px] rounded-full"
          style={{ background: 'var(--chef-bg)', color: 'var(--chef-ink)' }}
        >
          {ui.chef}
        </span>
      )}
      {item.gf && (
        <span
          className="text-[10px] font-semibold tracking-[1px] px-[7px] py-[3px] rounded-full"
          style={{ border: '1px solid var(--diet-border)', color: 'var(--diet)' }}
        >
          GF
        </span>
      )}
      {item.veg && (
        <span
          className="text-[10px] font-semibold tracking-[1px] px-[7px] py-[3px] rounded-full"
          style={{ border: '1px solid var(--diet-border)', color: 'var(--diet)' }}
        >
          V
        </span>
      )}
    </div>
  );
}
