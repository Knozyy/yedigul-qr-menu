import { useState } from 'react';
import { api } from '../../lib/api';

// "Şaraplar & Kokteyller" -> "saraplar-kokteyller"
function slugify(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (ch) => map[ch])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid rgba(22,41,61,0.10)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(10,31,53,0.04)',
  overflow: 'hidden',
};

const rowStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px 9px 10px', borderBottom: '1px solid rgba(22,41,61,0.08)' };

const iconBtnStyle = (danger) => ({
  flex: '0 0 auto', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: `1px solid ${danger ? 'rgba(163,59,46,0.30)' : 'rgba(22,41,61,0.14)'}`,
  borderRadius: 10, color: danger ? 'var(--danger)' : 'var(--muted-2)', cursor: 'pointer',
});

const inputStyle = {
  height: 42, padding: '0 12px', background: '#FFFFFF',
  border: '1px solid rgba(22,41,61,0.22)', borderRadius: 10, color: 'var(--text)', fontSize: 14.5, fontWeight: 500,
};

function DragHandleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flex: '0 0 auto', color: 'rgba(22,41,61,0.30)' }}>
      <path d="M9 6.5 L9.01 6.5 M15 6.5 L15.01 6.5 M9 12 L9.01 12 M15 12 L15.01 12 M9 17.5 L9.01 17.5 M15 17.5 L15.01 17.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function CategoryForm({ categories, products, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [nameTr, setNameTr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [error, setError] = useState('');
  // satır içi yeniden adlandırma: düzenlenen kategori id'si + taslak adlar
  const [editId, setEditId] = useState(null);
  const [editTr, setEditTr] = useState('');
  const [editEn, setEditEn] = useState('');
  const [editAr, setEditAr] = useState('');
  const [editRu, setEditRu] = useState('');

  function startEdit(cat) {
    setError('');
    setEditId(cat.id);
    setEditTr(cat.name_tr);
    setEditEn(cat.name_en);
    setEditAr(cat.name_ar || '');
    setEditRu(cat.name_ru || '');
  }

  function cancelEdit() {
    setEditId(null);
    setEditTr('');
    setEditEn('');
    setEditAr('');
    setEditRu('');
  }

  async function saveEdit(cat) {
    const tr = editTr.trim();
    const en = editEn.trim();
    if (!tr || !en) {
      setError('Kategori adı (TR ve EN) boş olamaz.');
      return;
    }
    setError('');
    try {
      await api.patch(`/admin/categories/${cat.id}`, {
        name_tr: tr, name_en: en, name_ar: editAr.trim(), name_ru: editRu.trim(),
      });
      cancelEdit();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onAdd(e) {
    e.preventDefault();
    setError('');
    const base = slugify(nameTr);
    if (!base) {
      setError('Geçerli bir kategori adı girin.');
      return;
    }
    // avoid id collisions with existing categories
    let id = base;
    for (let n = 2; categories.some((c) => c.id === id); n++) id = `${base}-${n}`;
    try {
      await api.post('/admin/categories', {
        id, name_tr: nameTr, name_en: nameEn, name_ar: nameAr.trim(), name_ru: nameRu.trim(),
      });
      setNameTr(''); setNameEn(''); setNameAr(''); setNameRu('');
      setAdding(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(cat, canDel) {
    if (!canDel) {
      setError(`"${cat.name_tr}" kategorisinde ürün var, önce ürünleri taşı/sil.`);
      return;
    }
    if (!confirm('Kategori silinsin mi?')) return;
    setError('');
    try {
      await api.del(`/admin/categories/${cat.id}`);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onToggleActive(cat, next) {
    setError('');
    try {
      await api.patch(`/admin/categories/${cat.id}`, { is_active: next });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  // yeni sırayı hesapla (index ile index+dir yer değiştirir), TÜM listeyi 0..n-1'e
  // yeniden numaralandır, yalnızca sırası DEĞİŞEN kategorileri PATCH'le.
  async function moveCat(index, dir) {
    const j = index + dir;
    if (j < 0 || j >= categories.length) return;
    const list = [...categories];
    [list[index], list[j]] = [list[j], list[index]];
    setError('');
    try {
      await Promise.all(
        list
          .map((c, idx) => (c.sort !== idx ? api.patch(`/admin/categories/${c.id}`, { sort: idx }) : null))
          .filter(Boolean)
      );
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={cardStyle}>
        {categories.map((c, idx) => {
          const active = c.is_active === 1;
          const count = products.filter((p) => p.category_id === c.id).length;
          const canDel = count === 0 && categories.length > 1;

          if (editId === c.id) {
            return (
              <div key={c.id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingTop: 10, paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DragHandleIcon />
                  <input
                    autoFocus
                    aria-label="Kategori adı (TR)"
                    value={editTr}
                    onChange={(e) => setEditTr(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(c); if (e.key === 'Escape') cancelEdit(); }}
                    style={{ ...inputStyle, flex: 1, minWidth: 0, borderColor: 'var(--gold)' }}
                  />
                  <button
                    onClick={() => saveEdit(c)}
                    aria-label="Kaydet"
                    style={{ flex: '0 0 auto', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold)', border: 'none', borderRadius: '50%', color: '#081726', cursor: 'pointer' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={cancelEdit} aria-label="Vazgeç" style={iconBtnStyle(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 26 }}>
                  <input aria-label="Kategori adı (EN)" placeholder="Ad (EN)" value={editEn} onChange={(e) => setEditEn(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                  <input dir="rtl" aria-label="Kategori adı (AR)" placeholder="الاسم (AR)" value={editAr} onChange={(e) => setEditAr(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                  <input aria-label="Kategori adı (RU)" placeholder="Название (RU)" value={editRu} onChange={(e) => setEditRu(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                </div>
              </div>
            );
          }

          return (
            <div key={c.id} style={{ ...rowStyle, opacity: active ? 1 : 0.55 }}>
              <DragHandleIcon />
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                {c.name_tr}
              </span>
              <span style={{ flex: '0 0 auto', fontSize: 12, color: 'var(--muted)', background: 'rgba(22,41,61,0.06)', padding: '4px 10px', borderRadius: 999 }}>
                {count} ürün
              </span>
              <button
                onClick={() => onToggleActive(c, active ? 0 : 1)}
                aria-label={active ? 'Menüden gizle' : 'Menüde göster'}
                title={active ? 'Menüden gizle' : 'Menüde göster'}
                style={{ ...iconBtnStyle(false), color: active ? 'var(--gold-dk, var(--gold))' : 'var(--muted)' }}
              >
                {active ? (
                  <svg width="15" height="15" viewBox="0 0 24 24"><path d="M2 12 C4.5 7 8 4.5 12 4.5 S19.5 7 22 12 C19.5 17 16 19.5 12 19.5 S4.5 17 2 12 Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24"><path d="M3 3 L21 21 M9.9 9.9 A3 3 0 0 0 12 15 A3 3 0 0 0 14.1 14.1 M6.2 6.5 C4.4 7.7 3 9.7 2 12 C4.5 17 8 19.5 12 19.5 C13.9 19.5 15.6 18.9 17.1 17.9 M10.6 5 C11.1 4.9 11.5 4.9 12 4.9 C16 4.9 19.5 7.4 22 12.4 C21.4 13.6 20.7 14.7 19.9 15.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </button>
              <button onClick={() => moveCat(idx, -1)} aria-label="Yukarı taşı" disabled={idx === 0} style={{ ...iconBtnStyle(false), opacity: idx === 0 ? 0.3 : 1, cursor: idx === 0 ? 'default' : 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 24 24"><path d="M6 14.5 L12 8.5 L18 14.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={() => moveCat(idx, 1)} aria-label="Aşağı taşı" disabled={idx === categories.length - 1} style={{ ...iconBtnStyle(false), opacity: idx === categories.length - 1 ? 0.3 : 1, cursor: idx === categories.length - 1 ? 'default' : 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 24 24"><path d="M6 9.5 L12 15.5 L18 9.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={() => startEdit(c)} aria-label="Yeniden adlandır" style={iconBtnStyle(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24"><path d="M4.8 19.2 L8.6 18.4 L19 8 A2.1 2.1 0 0 0 16 5 L5.6 15.4 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={() => onDelete(c, canDel)} aria-label="Sil" style={{ ...iconBtnStyle(true), opacity: canDel ? 1 : 0.3 }}>
                <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 7 H19 M9.5 7 V5 H14.5 V7 M7 7 L7.8 19 H16.2 L17 7 M10.2 10.5 V15.8 M13.8 10.5 V15.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        Sıralama menüde birebir aynı şekilde görünür. Yalnızca boş kategoriler silinebilir.
      </p>

      {error && <span className="text-sm" style={{ color: 'var(--danger)' }}>{error}</span>}

      {adding ? (
        <form onSubmit={onAdd} style={{ ...cardStyle, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input style={{ ...inputStyle, width: '100%' }} placeholder="Ad (TR)" value={nameTr} onChange={(e) => setNameTr(e.target.value)} required />
          <input style={{ ...inputStyle, width: '100%' }} placeholder="Ad (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
          <input dir="rtl" style={{ ...inputStyle, width: '100%' }} placeholder="الاسم (AR) — isteğe bağlı" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          <input style={{ ...inputStyle, width: '100%' }} placeholder="Название (RU) — isteğe bağlı" value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ height: 44, padding: '0 20px', border: 'none', borderRadius: 999, background: 'var(--gold)', color: '#081726', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNameTr(''); setNameEn(''); setNameAr(''); setNameRu(''); setError(''); }}
              style={{ height: 44, padding: '0 20px', border: '1px solid rgba(22,41,61,0.22)', borderRadius: 999, background: 'transparent', color: 'var(--text)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 18px',
            background: 'transparent', border: '1.5px dashed rgba(22,41,61,0.30)', borderRadius: 999,
            color: 'var(--text)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 5 V19 M5 12 H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span>Yeni Kategori</span>
        </button>
      )}
    </div>
  );
}
