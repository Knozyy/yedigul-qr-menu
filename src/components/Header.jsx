import Heart from './Heart';

export default function Header({
  ui,
  dark,
  onToggleTheme,
  lang,
  onSetLang,
  favView,
  favCount,
  onToggleFavView,
}) {
  return (
    <header
      className="px-5 pt-[18px] pb-3.5"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-[3px]">
          <span
            className="yg-overline text-[9.5px]"
            style={{ color: 'var(--gold)' }}
          >
            Bosphorus · İstanbul
          </span>
          <span
            className="font-outfit text-[32px] font-semibold leading-[0.95] tracking-[.005em] mt-[3px]"
            style={{ color: 'var(--text)' }}
          >
            Yedigül
          </span>
          <span className="font-inter text-[11.5px] mt-[3px]" style={{ color: 'var(--muted)' }}>
            {ui.tagline}
          </span>
        </div>

        <div className="flex-none flex items-center gap-2">
          <button
            onClick={onToggleFavView}
            aria-label={ui.favorites}
            aria-pressed={favView}
            className="relative flex-none w-[38px] h-[38px] rounded-full border flex items-center justify-center cursor-pointer p-0"
            style={
              favView
                ? { borderColor: 'var(--gold)', background: 'var(--gold)' }
                : { borderColor: 'var(--border)', background: 'var(--surface-2)' }
            }
          >
            <Heart filled={favView} size={16} color={favView ? '#fff' : 'var(--muted)'} />
            {favCount > 0 && !favView && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[3px] rounded-full font-inter text-[9px] font-bold flex items-center justify-center"
                style={{ background: 'var(--gold)', color: '#fff' }}
              >
                {favCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleTheme}
            aria-label="theme"
            className="flex-none w-[38px] h-[38px] rounded-full border flex items-center justify-center cursor-pointer p-0"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          >
            {dark ? (
              <span
                className="w-[15px] h-[15px] rounded-full bg-transparent"
                style={{ boxShadow: '5px -4px 0 0 var(--gold)' }}
              />
            ) : (
              <span
                className="w-[13px] h-[13px] rounded-full"
                style={{ background: 'var(--gold)', boxShadow: '0 0 0 3px var(--gold-tint)' }}
              />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3.5">
        <a
          href="/"
          className="font-inter text-[12px] font-semibold tracking-[.06em] no-underline flex items-center gap-1.5"
          style={{ color: 'var(--gold)' }}
        >
          <span aria-hidden="true">←</span>
          {ui.home}
        </a>
        <div
          className="inline-flex p-[3px] rounded-full border"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          {['tr', 'en'].map((code) => {
            const active = lang === code;
            return (
              <button
                key={code}
                onClick={() => onSetLang(code)}
                className="border-none cursor-pointer font-inter text-[12px] font-semibold tracking-[.06em] px-3.5 py-1.5 rounded-full"
                style={
                  active
                    ? { background: 'var(--navy-2)', color: '#fff' }
                    : { background: 'transparent', color: 'var(--muted)' }
                }
              >
                {code.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
