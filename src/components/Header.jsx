import { LANGUAGES } from '../lib/i18n.js';

// Boğaz dalgası süsü — marka satırının iki yanında.
function Wave() {
  return (
    <svg width="34" height="10" viewBox="0 0 38 10" className="flex-none" aria-hidden="true">
      <path
        d="M1 5.5 C4 1.5 7 1.5 10 5.5 C13 9.5 16 9.5 19 5.5 C22 1.5 25 1.5 28 5.5 C31 9.5 34 9.5 37 5.5"
        fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header({ ui, dark, onToggleTheme, lang, onSetLang }) {
  return (
    <header style={{ background: 'var(--bg)', borderBottom: '1px solid var(--faint)', transition: 'background .35s ease' }}>
      <div className="max-w-[980px] mx-auto px-4 pt-3 pb-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div
            role="group"
            aria-label={ui.language}
            className="flex overflow-hidden rounded-full border"
            style={{ borderColor: 'var(--faint-strong)' }}
          >
            {LANGUAGES.map(({ code, dir, nativeName }) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  onClick={() => onSetLang(code)}
                  lang={code}
                  dir={dir}
                  aria-label={`${ui.language}: ${nativeName}`}
                  aria-pressed={active}
                  className="min-w-[46px] h-11 px-1.5 border-none cursor-pointer text-[13px] tracking-[.5px] transition-colors duration-200"
                  style={{
                    background: active ? 'var(--accent-text)' : 'transparent',
                    color: active ? 'var(--on-accent)' : 'var(--muted)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>
          <button
            onClick={onToggleTheme}
            aria-label={dark ? ui.useLightTheme : ui.useDarkTheme}
            className="flex-none w-11 h-11 flex items-center justify-center rounded-full border cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--faint-strong)', color: 'var(--text)' }}
          >
            {dark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5.3 5.3 L7 7 M17 17 L18.7 18.7 M18.7 5.3 L17 7 M7 17 L5.3 18.7"
                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20 14.2 A8.3 8.3 0 1 1 9.8 4 A6.8 6.8 0 0 0 20 14.2 Z"
                  fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-3.5 text-center pt-0.5">
          {/* Gerçek amblem (www/images/logo/logo.png'den kırpılmış balık-Y);
              zemini lacivert olduğundan madalyon gibi daire içinde kullanılır. */}
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex-none"
            style={{ border: '1.5px solid var(--accent-text)' }}
          >
            <img
              src={`${import.meta.env.BASE_URL}logo-mark.png`}
              alt={ui.logoAlt}
              width="56"
              height="56"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col items-center gap-[5px]">
            <h1 className="m-0 font-outfit text-[34px] font-semibold tracking-[.5px] leading-[1.05]" style={{ color: 'var(--text)' }}>
              Yedigül
            </h1>
            <div className="text-[11.5px] tracking-[3px] uppercase font-medium" style={{ color: 'var(--muted)' }}>
              {ui.sub}
            </div>
            <div className="flex items-center gap-[9px]" style={{ color: 'var(--accent-text)' }}>
              <Wave />
              <span className="text-[11px] tracking-[1.2px]" style={{ color: 'var(--muted)' }}>
                {ui.locationShort}
              </span>
              <Wave />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
