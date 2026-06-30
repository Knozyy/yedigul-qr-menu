import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThemeVars } from '../../lib/theme';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const vars = getThemeVars(true, '#C8902F');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ ...vars, background: 'var(--bg)' }}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[360px] flex flex-col gap-4 p-6 rounded-2xl border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <h1 className="font-outfit text-xl font-semibold">Yedigül · Yönetim</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          autoFocus
          className="px-4 py-3 rounded-xl border bg-transparent outline-none"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }}
        />
        {error && <span className="text-sm" style={{ color: '#ef6b6b' }}>{error}</span>}
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-3 rounded-xl font-semibold disabled:opacity-60"
          style={{ background: 'var(--gold)', color: '#fff' }}
        >
          {busy ? 'Giriş yapılıyor…' : 'Giriş'}
        </button>
      </form>
    </div>
  );
}
