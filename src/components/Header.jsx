import { LANGUAGES } from '../lib/i18n.js';
import HomeLink from './HomeLink';

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

export default function Header({ ui, dark, onToggleTheme, lang, onSetLang, rtl = false }) {
  return (
    <header className="yg-menu-hero">
      <img
        className="yg-menu-hero__photo"
        src="/images/slider/2.jpg"
        alt=""
        aria-hidden="true"
      />
      <span className="yg-menu-hero__veil" aria-hidden="true" />
      <div className="yg-menu-hero__inner">
        <div className="yg-menu-hero__topbar">
          <HomeLink label={ui.home} rtl={rtl} inverse />
          <div
            role="group"
            aria-label={ui.language}
            className="yg-language-switcher"
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
                  className={`yg-language-switcher__button${active ? ' is-active' : ''}`}
                >
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>
          <button
            onClick={onToggleTheme}
            aria-label={dark ? ui.useLightTheme : ui.useDarkTheme}
            className="yg-theme-toggle"
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

        <div className="yg-menu-hero__brand">
          {/* Gerçek amblem (www/images/logo/logo.png'den kırpılmış balık-Y);
              zemini lacivert olduğundan madalyon gibi daire içinde kullanılır. */}
          <div className="yg-menu-hero__mark">
            <img
              src={`${import.meta.env.BASE_URL}logo-mark.png`}
              alt={ui.logoAlt}
              width="72"
              height="72"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="yg-menu-hero__copy">
            <p className="yg-overline yg-menu-hero__eyebrow">{ui.menuLabel}</p>
            <h1>Yedigül</h1>
            <p className="yg-menu-hero__lead">{ui.menuLead}</p>
            <div className="yg-menu-hero__meta">
              <Wave />
              <span>{ui.locationShort}</span>
              <Wave />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
