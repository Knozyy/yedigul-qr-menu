import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '../../lib/api';

// Menünün QR kodunu üretir. QR, sabit `/q` yolunu içerir; sunucu bunu göreli
// yönlendirmeyle menüye çevirir. Böylece:
//  - Menü yolu değişirse (ör. /menu/ -> /) sadece ayar güncellenir, QR aynı kalır.
//  - Aynı QR, sunucunun yayınlandığı her domainde çalışır.
// "Genel adres" alanı, QR'da hangi domainin kodlanacağını belirler (varsayılan:
// panele girilen adres). Domaininizi buraya yazın ki basılan QR doğru olsun.
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
    // inline script yok (CSP script-src 'self' ile uyumlu); görsel yüklenince yazdır.
    const img = w.document.querySelector('img');
    if (img) img.onload = () => w.print();
    else w.print();
  }

  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none w-full';
  const fieldStyle = { borderColor: 'var(--border-strong)', color: 'var(--text)' };

  return (
    <div className="mb-4 p-4 rounded-xl border flex flex-col gap-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <h2 className="font-outfit text-base font-semibold" style={{ color: 'var(--text)' }}>QR Kod</h2>

      <div className="flex flex-col items-center gap-2 py-2" ref={wrapRef}>
        <div className="p-3 rounded-xl bg-white">
          <QRCodeCanvas value={qrUrl} size={200} level="M" includeMargin={false} />
        </div>
        <span className="text-[12px] break-all text-center" style={{ color: 'var(--muted)' }}>
          QR içeriği: <b>{qrUrl}</b>
        </span>
        <span className="text-[11px] break-all text-center" style={{ color: 'var(--muted)' }}>
          → yönlendirir: {targetUrl}
        </span>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        <button type="button" onClick={() => download('png')} className="px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--gold)', color: '#fff' }}>
          PNG indir
        </button>
        <button type="button" onClick={printQr} className="px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }}>
          Yazdır
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <label className="text-[12px]" style={{ color: 'var(--muted)' }}>
          Genel adres (domain) — QR bu adresi kodlar. Boşsa panelin adresi kullanılır.
        </label>
        <input className={field} style={fieldStyle} placeholder="https://yedigul.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        <label className="text-[12px]" style={{ color: 'var(--muted)' }}>
          Menü yolu (ileri düzey) — QR'ın yönlendireceği yer. Varsayılan: /menu/
        </label>
        <input className={field} style={fieldStyle} placeholder="/menu/" value={menuPath} onChange={(e) => setMenuPath(e.target.value)} />
        <div className="flex items-center gap-3">
          <button type="button" onClick={onSave} className="px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--navy-2)', color: '#fff' }}>
            Kaydet
          </button>
          {msg && <span className="text-sm" style={{ color: 'var(--gold)' }}>{msg}</span>}
          {err && <span className="text-sm" style={{ color: '#ef6b6b' }}>{err}</span>}
        </div>
        {savedBase && (
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            Kayıtlı genel adres: {savedBase}
          </span>
        )}
      </div>
    </div>
  );
}
