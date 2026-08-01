import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '../../lib/api';

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid rgba(22,41,61,0.10)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(10,31,53,0.04)',
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};
const qrCardStyle = { ...cardStyle, alignItems: 'center', textAlign: 'center', padding: 24, gap: 14 };
const labelStyle = { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 };
const inputStyle = {
  width: '100%', height: 46, padding: '0 14px', background: '#FFFFFF',
  border: '1px solid rgba(22,41,61,0.22)', borderRadius: 12, color: 'var(--text)', fontSize: 14.5,
};
const smallHintStyle = { fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 };
const downloadBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 22px', border: 'none',
  borderRadius: 999, background: 'var(--gold)', color: '#081726', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
const ghostBtnStyle = {
  alignSelf: 'flex-start', height: 42, padding: '0 18px', background: 'transparent',
  border: '1px solid rgba(22,41,61,0.30)', borderRadius: 999, color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const saveBtnStyle = {
  alignSelf: 'flex-start', height: 44, padding: '0 20px', border: 'none', borderRadius: 999,
  background: 'var(--navy-2)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
};

function WaveDivider() {
  return (
    <svg width="30" height="9" viewBox="0 0 38 10">
      <path d="M1 5.5 C4 1.5 7 1.5 10 5.5 C13 9.5 16 9.5 19 5.5 C22 1.5 25 1.5 28 5.5 C31 9.5 34 9.5 37 5.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function QrPanel() {
  const [baseUrl, setBaseUrl] = useState('');
  const [menuPath, setMenuPath] = useState('/menu/');
  const [savedBase, setSavedBase] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    api.get('/admin/settings')
      .then((s) => {
        const origin = window.location.origin;
        setBaseUrl(s.public_base_url || origin);
        setSavedBase(s.public_base_url || '');
        setMenuPath(s.menu_path || '/menu/');
      })
      .catch((e) => setErr(e.message));
  }, []);

  const cleanBase = (baseUrl || window.location.origin).trim().replace(/\/+$/, '');
  const qrUrl = `${cleanBase}/q`;
  const targetUrl = `${cleanBase}${menuPath}`;

  async function onSave() {
    setErr(''); setMsg('');
    try {
      const res = await api.put('/admin/settings', {
        public_base_url: baseUrl.trim().replace(/\/+$/, ''),
        menu_path: menuPath.trim(),
      });
      setSavedBase(res.public_base_url || '');
      setMenuPath(res.menu_path || '/menu/');
      setMsg('Ayarlar kaydedildi');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setErr(e.message);
    }
  }

  function download(kind) {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    if (kind === 'png') {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'yedigul-qr.png';
      a.click();
    }
  }

  function printQr() {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><title>Yedigül QR</title>
      <div style="text-align:center;font-family:sans-serif;padding:40px">
        <h2 style="margin:0 0 8px">Yedigül · Menü</h2>
        <p style="margin:0 0 24px;color:#555">Menüyü görmek için kodu okutun</p>
        <img src="${dataUrl}" style="width:320px;height:320px" />
      </div>`);
    w.document.close();
    const img = w.document.querySelector('img');
    if (img) img.onload = () => w.print();
    else w.print();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 460 }}>
      <div style={qrCardStyle} ref={wrapRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--gold-dk)' }}>
          <WaveDivider />
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Yedigül</span>
          <WaveDivider />
        </div>
        <span style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--muted)' }}>Menü için okutun</span>

        <div style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(22,41,61,0.10)', background: '#fff' }}>
          <QRCodeCanvas value={qrUrl} size={236} level="M" includeMargin={false} />
        </div>

        <span style={{ fontSize: 12.5, color: 'var(--muted)', wordBreak: 'break-all' }}>{qrUrl}</span>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={() => download('png')} style={downloadBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 4 V15 M7.5 11 L12 15.5 L16.5 11 M5 19.5 H19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>PNG İndir</span>
          </button>
          <button type="button" onClick={printQr} style={ghostBtnStyle}>Yazdır</button>
        </div>

        <span style={smallHintStyle}>→ yönlendirir: {targetUrl}</span>
      </div>

      <div style={cardStyle}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>Genel Adres (Domain)</span>
          <input style={inputStyle} placeholder="https://yedigul.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </label>
        <span style={smallHintStyle}>QR bu adresi kodlar. Boşsa panelin adresi kullanılır.</span>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>Menü Yolu (İleri Düzey)</span>
          <input style={inputStyle} placeholder="/menu/" value={menuPath} onChange={(e) => setMenuPath(e.target.value)} />
        </label>
        <span style={smallHintStyle}>QR'ın yönlendireceği yer. Varsayılan: /menu/</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={onSave} style={saveBtnStyle}>Kaydet</button>
          {msg && <span style={{ fontSize: 13, color: 'var(--gold)' }}>{msg}</span>}
          {err && <span style={{ fontSize: 13, color: '#ef6b6b' }}>{err}</span>}
        </div>
        {savedBase && (
          <span style={smallHintStyle}>Kayıtlı genel adres: {savedBase}</span>
        )}
      </div>
    </div>
  );
}
