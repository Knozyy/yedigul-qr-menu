import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const HOURS_SPLIT_RE = /\s*[–-]\s*/;
const splitHours = (h) => {
  const [open = '', close = ''] = String(h || '').split(HOURS_SPLIT_RE);
  return [open.trim(), close.trim()];
};

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid rgba(22,41,61,0.10)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(10,31,53,0.04)',
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};
const headingStyle = { margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 21, fontWeight: 600, color: 'var(--text)' };
const labelStyle = { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 };
const inputStyle = {
  width: '100%', height: 46, padding: '0 14px', background: '#FFFFFF',
  border: '1px solid rgba(22,41,61,0.22)', borderRadius: 12, color: 'var(--text)', fontSize: 14.5,
};
const textareaStyle = {
  width: '100%', padding: '11px 14px', background: '#FFFFFF',
  border: '1px solid rgba(22,41,61,0.22)', borderRadius: 12, color: 'var(--text)', fontSize: 14.5,
  lineHeight: 1.5, resize: 'vertical',
};
const smallHintStyle = { fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 };
const saveBtnStyle = {
  alignSelf: 'flex-start', height: 44, padding: '0 20px', border: 'none', borderRadius: 999,
  background: 'var(--gold)', color: '#081726', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
};

function Field({ label, ...props }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={labelStyle}>{label}</span>
      <input style={inputStyle} {...props} />
    </label>
  );
}

export default function InfoPanel() {
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState('');

  const [sTr, setSTr] = useState('');
  const [sEn, setSEn] = useState('');
  const [sAr, setSAr] = useState('');
  const [sRu, setSRu] = useState('');
  const [annSaving, setAnnSaving] = useState(false);
  const [annMsg, setAnnMsg] = useState('');
  const [annErr, setAnnErr] = useState('');

  const [sWifi, setSWifi] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sOpen, setSOpen] = useState('');
  const [sClose, setSClose] = useState('');
  const [sInsta, setSInsta] = useState('');
  const [sReview, setSReview] = useState('');
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');
  const [infoErr, setInfoErr] = useState('');

  useEffect(() => {
    api.get('/admin/settings')
      .then((s) => {
        setSTr(s.announcement_tr || '');
        setSEn(s.announcement_en || '');
        setSAr(s.announcement_ar || '');
        setSRu(s.announcement_ru || '');
        setSWifi(s.info_wifi || '');
        setSPhone(s.info_phone || '');
        const [open, close] = splitHours(s.info_hours);
        setSOpen(open);
        setSClose(close);
        setSInsta(s.info_instagram || '');
        setSReview(s.info_google_review_url || '');
        setLoaded(true);
      })
      .catch((e) => setLoadErr(e.message));
  }, []);

  async function saveAnn() {
    setAnnErr(''); setAnnMsg(''); setAnnSaving(true);
    try {
      const res = await api.put('/admin/settings', {
        announcement_tr: sTr.trim(),
        announcement_en: sEn.trim(),
        announcement_ar: sAr.trim(),
        announcement_ru: sRu.trim(),
      });
      setSTr(res.announcement_tr || '');
      setSEn(res.announcement_en || '');
      setSAr(res.announcement_ar || '');
      setSRu(res.announcement_ru || '');
      setAnnMsg('Duyuru kaydedildi');
      setTimeout(() => setAnnMsg(''), 2000);
    } catch (e) {
      setAnnErr(e.message);
    } finally {
      setAnnSaving(false);
    }
  }

  async function saveInfo() {
    setInfoErr(''); setInfoMsg(''); setInfoSaving(true);
    try {
      const res = await api.put('/admin/settings', {
        info_wifi: sWifi.trim(),
        info_phone: sPhone.trim(),
        info_hours: `${sOpen.trim() || '11:00'} – ${sClose.trim() || '00:00'}`,
        info_instagram: sInsta.trim(),
        info_google_review_url: sReview.trim(),
      });
      setSWifi(res.info_wifi || '');
      setSPhone(res.info_phone || '');
      const [open, close] = splitHours(res.info_hours);
      setSOpen(open);
      setSClose(close);
      setSInsta(res.info_instagram || '');
      setSReview(res.info_google_review_url || '');
      setInfoMsg('Bilgiler kaydedildi');
      setTimeout(() => setInfoMsg(''), 2000);
    } catch (e) {
      setInfoErr(e.message);
    } finally {
      setInfoSaving(false);
    }
  }

  if (loadErr) {
    return <p style={{ fontSize: 13, color: '#ef6b6b' }}>{loadErr}</p>;
  }
  if (!loaded) {
    return <p style={{ fontSize: 13, color: 'var(--muted)' }}>Yükleniyor…</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <h3 style={headingStyle}>Duyuru</h3>
          <span style={smallHintStyle}>Menünün üstündeki şeritte görünür. Boş bırakılırsa şerit gizlenir.</span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>Türkçe</span>
          <textarea style={textareaStyle} rows={2} value={sTr} onChange={(e) => setSTr(e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>İngilizce</span>
          <textarea style={textareaStyle} rows={2} value={sEn} onChange={(e) => setSEn(e.target.value)} />
        </label>

        <details>
          <summary style={{ ...labelStyle, cursor: 'pointer', listStyle: 'none' }}>Diğer diller ▾</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            <span style={smallHintStyle}>Boş bırakılan alan menüde İngilizce, o da boşsa Türkçe görünür.</span>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={labelStyle}>العربية (AR)</span>
              <textarea dir="rtl" style={textareaStyle} rows={2} value={sAr} onChange={(e) => setSAr(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={labelStyle}>Русский (RU)</span>
              <textarea style={textareaStyle} rows={2} value={sRu} onChange={(e) => setSRu(e.target.value)} />
            </label>
          </div>
        </details>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={saveAnn} disabled={annSaving} style={{ ...saveBtnStyle, opacity: annSaving ? 0.6 : 1 }}>
            {annSaving ? 'Kaydediliyor…' : 'Duyuruyu Kaydet'}
          </button>
          {annMsg && <span style={{ fontSize: 13, color: 'var(--gold)' }}>{annMsg}</span>}
          {annErr && <span style={{ fontSize: 13, color: '#ef6b6b' }}>{annErr}</span>}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={headingStyle}>İşletme Bilgileri</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Field label="Wi-Fi Şifresi" placeholder="örn. yedigul2024" value={sWifi} onChange={(e) => setSWifi(e.target.value)} />
          <Field label="Telefon" placeholder="0216 000 00 00" value={sPhone} onChange={(e) => setSPhone(e.target.value)} />
          <Field label="Açılış" placeholder="11:00" value={sOpen} onChange={(e) => setSOpen(e.target.value)} />
          <Field label="Kapanış" placeholder="00:00" value={sClose} onChange={(e) => setSClose(e.target.value)} />
          <Field label="Instagram" placeholder="@yedigulrestorant" value={sInsta} onChange={(e) => setSInsta(e.target.value)} />
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>Google Yorum Bağlantısı</span>
          <input
            style={inputStyle}
            placeholder="https://g.page/r/.../review"
            value={sReview}
            onChange={(e) => setSReview(e.target.value)}
          />
          <span style={smallHintStyle}>
            Google İşletme Profili → "Yorum iste" bağlantısını buraya yapıştırın.
            Boş bırakılırsa menüdeki yıldız değerlendirme bloğu hiç görünmez.
            Bağlantı https:// ile başlamalıdır.
          </span>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={saveInfo} disabled={infoSaving} style={{ ...saveBtnStyle, opacity: infoSaving ? 0.6 : 1 }}>
            {infoSaving ? 'Kaydediliyor…' : 'Bilgileri Kaydet'}
          </button>
          {infoMsg && <span style={{ fontSize: 13, color: 'var(--gold)' }}>{infoMsg}</span>}
          {infoErr && <span style={{ fontSize: 13, color: '#ef6b6b' }}>{infoErr}</span>}
        </div>
      </div>
    </div>
  );
}
