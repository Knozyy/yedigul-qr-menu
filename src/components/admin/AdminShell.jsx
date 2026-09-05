import { useEffect, useState } from 'react';
import AdminNav from './AdminNav';
import { getAdminThemeVars } from '../../lib/theme';

function Logo({ size = 42, fontSize = 23 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1.5px solid var(--gold-lt)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      <span
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize,
          fontWeight: 600,
          color: 'var(--gold-lt)',
          lineHeight: 1,
          paddingBottom: 2,
        }}
      >
        Y
      </span>
    </div>
  );
}

function MenuLinkIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: '0 0 auto' }} aria-hidden="true">
      <path
        d="M9.5 5 H5 V19 H19 V14.5 M14 4 H20 V10 M20 4 L11.5 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: '0 0 auto' }} aria-hidden="true">
      <path
        d="M13 4 H5 V20 H13 M10 12 H21 M17.5 8.5 L21 12 L17.5 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminShell({ view, onSelectView, onLogout, unread, children }) {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = w < 780;

  return (
    <div
      style={{
        ...getAdminThemeVars(),
        background: 'var(--cream)',
        color: 'var(--text)',
        minHeight: '100vh',
        fontFamily: "Jost, system-ui, sans-serif",
      }}
    >
      {isMobile ? (
        <>
          <header
            style={{
              background: 'var(--ink)',
              color: '#F2E9D6',
              position: 'sticky',
              top: 0,
              zIndex: 40,
            }}
          >
            <div style={{ height: 58, padding: '0 8px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Logo size={32} fontSize={18} />
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 600 }}>Yedigül</span>
                <span style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(242,233,214,0.55)', marginTop: 3 }}>
                  Yönetim
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <a
                  href="/menu/"
                  target="_blank"
                  rel="noopener"
                  aria-label="Menüyü yeni sekmede görüntüle"
                  style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-lt)' }}
                >
                  <MenuLinkIcon size={19} />
                </a>
                <button
                  onClick={onLogout}
                  aria-label="Çıkış Yap"
                  style={{
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(242,233,214,0.6)',
                    cursor: 'pointer',
                  }}
                >
                  <LogoutIcon size={19} />
                </button>
              </div>
            </div>
          </header>

          <main style={{ padding: '18px 16px 110px' }}>{children}</main>

          <nav
            aria-label="Bölümler"
            style={{
              position: 'fixed',
              insetInline: 0,
              bottom: 0,
              zIndex: 50,
              background: 'var(--ink)',
            }}
          >
            <AdminNav view={view} onSelect={onSelectView} variant="bottom" unread={unread} />
          </nav>
        </>
      ) : (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'stretch' }}>
          <aside
            style={{
              width: 238,
              flex: '0 0 auto',
              background: 'var(--ink)',
              color: '#F2E9D6',
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              top: 0,
              height: '100vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '22px 18px 12px', display: 'flex', alignItems: 'center', gap: 11 }}>
              <Logo />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
                  Yedigül
                </span>
                <span style={{ fontSize: 9.5, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(242,233,214,0.55)' }}>
                  Yönetim Paneli
                </span>
              </div>
            </div>

            <AdminNav view={view} onSelect={onSelectView} variant="side" unread={unread} />

            <div
              style={{
                borderTop: '1px solid rgba(242,233,214,0.12)',
                padding: '10px 8px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <a
                href="/menu/"
                target="_blank"
                rel="noopener"
                title="Menüyü yeni sekmede aç"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  minHeight: 44,
                  padding: '0 10px',
                  borderRadius: 10,
                  color: 'var(--gold-lt)',
                  fontSize: '13.5px',
                  fontWeight: 500,
                }}
              >
                <MenuLinkIcon />
                <span>Menüyü Görüntüle</span>
              </a>
              <button
                onClick={onLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  minHeight: 44,
                  padding: '0 10px',
                  borderRadius: 10,
                  background: 'none',
                  border: 'none',
                  color: 'rgba(242,233,214,0.6)',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'start',
                  width: '100%',
                }}
              >
                <LogoutIcon />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </aside>

          <main style={{ flex: 1, minWidth: 0, padding: '30px 34px 60px' }}>{children}</main>
        </div>
      )}
    </div>
  );
}
