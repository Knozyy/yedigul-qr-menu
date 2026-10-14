import { useState } from 'react';

export function LoginGate({ onLogin, error }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try { await onLogin(password); } finally { setBusy(false); }
  }
  return (
    <div className="gate-page">
      <form className="gate-card" onSubmit={submit}>
        <span className="brand-mark large">Y</span>
        <span className="eyebrow">YEDİGÜL YÖNETİM</span>
        <h1>Yönetim oturumu</h1>
        <p>Canlı veritabanını düzenlemek için sunucudaki yönetim şifresini girin. Şifre diske kaydedilmez.</p>
        {error && <div className="alert error">{error}</div>}
        <label className="field"><span>Yönetim şifresi</span><input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></label>
        <button className="primary-button full" disabled={busy || !password}>{busy ? 'Doğrulanıyor…' : 'Panele gir'}</button>
      </form>
    </div>
  );
}

