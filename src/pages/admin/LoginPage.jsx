import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context.js';
import { getAdminThemeVars } from '../../lib/theme';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login(password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Şifre hatalı, tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        ...getAdminThemeVars(),
        minHeight: '100vh',
        background: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Jost, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: 'min(400px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '1.5px solid var(--gold-lt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 34,
                fontWeight: 600,
                color: 'var(--gold-lt)',
                lineHeight: 1,
                paddingBottom: 4,
              }}
            >
              Y
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 38,
                fontWeight: 600,
                color: '#F2E9D6',
                lineHeight: 1,
              }}
            >
              Yedigül
            </h1>
            <span
              style={{
                fontSize: 11,
                letterSpacing: '3.5px',
                textTransform: 'uppercase',
                color: 'rgba(242,233,214,0.6)',
                fontWeight: 500,
              }}
            >
              Yönetim Paneli
            </span>
          </div>
          <svg width="38" height="10" viewBox="0 0 38 10" style={{ color: 'var(--gold-lt)' }} aria-hidden="true">
            <path
              d="M1 5.5 C4 1.5 7 1.5 10 5.5 C13 9.5 16 9.5 19 5.5 C22 1.5 25 1.5 28 5.5 C31 9.5 34 9.5 37 5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            width: '100%',
            background: 'var(--ink-2)',
            border: '1px solid rgba(242,233,214,0.12)',
            borderRadius: 18,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            textAlign: 'start',
          }}
        >
          <label
            htmlFor="admin-password"
            style={{
              fontSize: 11,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(242,233,214,0.55)',
              fontWeight: 600,
            }}
          >
            Şifre
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            aria-label="Şifre"
            autoFocus
            style={{
              width: '100%',
              height: 48,
              padding: '0 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(242,233,214,0.22)',
              borderRadius: 12,
              color: '#F2E9D6',
              fontSize: 16,
              letterSpacing: '3px',
              outline: 'none',
            }}
          />
          {error && <span style={{ fontSize: 13, color: '#E09B72' }}>{error}</span>}
          <button
            type="submit"
            disabled={busy}
            style={{
              height: 48,
              border: 'none',
              borderRadius: 999,
              background: 'var(--gold)',
              color: '#081726',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.3px',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>

        <span style={{ fontSize: 11.5, color: 'rgba(242,233,214,0.4)', letterSpacing: '0.5px' }}>
          Anadolukavağı, Beykoz — İstanbul
        </span>
      </div>
    </div>
  );
}
