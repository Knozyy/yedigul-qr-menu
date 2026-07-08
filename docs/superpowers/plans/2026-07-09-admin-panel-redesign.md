# Admin Paneli Yeniden Tasarımı — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yönetim panelini (`/menu/admin`) responsive bir dashboard kabuğuna dönüştürmek — mobilde tek sütun + alt sekme, geniş ekranda yan menü; ürünlerde arama/filtre; gruplu form.

**Architecture:** Sadece frontend. `DashboardPage` orkestrasyona indirgenir (`view` + `editing` + veri); görsel kabuk `AdminShell`+`AdminNav`'a, ürün yönetimi `ProductsView`+`ProductCard`'a taşınır. Diğer paneller (Kategoriler/Bilgiler/Geçmiş/QR) mevcut bileşenlerle "sayfa" olur. Backend/API değişmez.

**Tech Stack:** React 19, Vite, TailwindCSS v4, react-router. Doğrulama: `npm run build`, `npm run lint`, `npm run test:e2e`.

## Global Constraints

- Backend API / veri modeli / route DEĞİŞMEZ. Yeni endpoint yok.
- Tema `getThemeVars(true, '#C8902F')` CSS değişkenleri (lacivert/altın/krem) korunur.
- **e2e seçicileri korunmalı** (yoksa `e2e/admin.spec.js` kırılır):
  - Giriş sonrası bir yerde `Yönetim Paneli` metni görünür.
  - Nav'da erişilebilir adı tam `Kategoriler` olan buton.
  - Ürün öğesi: içinde ürün adı metni + `Düzenle` düğmesi olan bir `div`.
  - Ürün öğesinde `Aktif`/`Pasif` düğmesi.
  - Formda placeholder `Fiyat (TL)`, `Ad (TR)`, `الاسم (AR)`; düğme `Kaydet`, `İptal`; `+ Varyant ekle`; katlanır başlık metni `Çeviriler (Arapça / Rusça)`.
- **Responsive nav gizleme `display` tabanlı olmalı** (Tailwind `hidden md:flex` / `md:hidden`). Böylece yan menü ve alt çubuk aynı anda erişilebilirlik ağacında olmaz; `getByRole('button',{name:'Kategoriler'})` tek eşleşir.
- Her task sonunda `npm run build` ve `npm run lint` temiz olmalı; riskli task'larda `npm run test:e2e` yeşil kalmalı.

---

## Dosya yapısı

| Dosya | Durum | Sorumluluk |
|-------|-------|-----------|
| `src/components/admin/AdminNav.jsx` | yeni | Nav öğe listesi (ikon+etiket); sidebar VEYA bottom-bar olarak render |
| `src/components/admin/AdminShell.jsx` | yeni | Responsive kabuk: üst çubuk + nav yerleşimi + içerik slotu |
| `src/components/admin/ProductCard.jsx` | yeni | Tek ürün kartı (ProductRow yerine) |
| `src/components/admin/ProductsView.jsx` | yeni | Arama + filtre + sayaç + liste; reorder/toggle mantığı |
| `src/components/admin/Section.jsx` | yeni | Formda katlanabilir/başlıklı bölüm sarmalayıcı |
| `src/pages/admin/DashboardPage.jsx` | değişir | Orkestrasyon: `view`+`editing`+veri; render `AdminShell` |
| `src/components/admin/ProductForm.jsx` | değişir | Alanlar `Section`'lara bölünür; masaüstünde 2 sütun |
| `src/components/admin/ProductRow.jsx` | silinir | `ProductCard` devralır |

---

## Task 1: AdminNav bileşeni

**Files:**
- Create: `src/components/admin/AdminNav.jsx`

**Interfaces:**
- Produces: `NAV_ITEMS` (dışa aktarılır): `[{ id, label }]` — id ∈ `products|categories|info|history|qr`.
- Produces: `export default function AdminNav({ view, onSelect, variant })` — `variant` ∈ `'side'|'bottom'`.

- [ ] **Step 1: Bileşeni oluştur**

```jsx
// src/components/admin/AdminNav.jsx
// Inline SVG ikonlar (CSP: harici kaynak yok). Nav öğeleri tek kaynak.
const Icon = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const ICONS = {
  products: <path d="M3 7h18M3 12h18M3 17h18" />,
  categories: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 8v4l3 2" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v7M14 20h7" /></>,
};

export const NAV_ITEMS = [
  { id: 'products', label: 'Ürünler' },
  { id: 'categories', label: 'Kategoriler' },
  { id: 'info', label: 'Bilgiler' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'qr', label: 'QR Kod' },
];

export default function AdminNav({ view, onSelect, variant }) {
  const side = variant === 'side';
  return (
    <nav className={side ? 'flex flex-col gap-1' : 'flex items-stretch justify-around'}>
      {NAV_ITEMS.map((it) => {
        const active = view === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            aria-current={active ? 'page' : undefined}
            className={
              side
                ? 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium text-left'
                : 'flex flex-col items-center gap-0.5 flex-1 py-1.5 text-[10.5px] font-medium'
            }
            style={{
              color: active ? 'var(--gold)' : 'var(--muted)',
              background: side && active ? 'var(--gold-tint)' : 'transparent',
            }}
          >
            <Icon d={ICONS[it.id]} />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: hata yok (AdminNav henüz kullanılmıyor, ağaç-sarsımıyla elenebilir; derleme geçer).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: yalnız mevcut `only-export-components` uyarıları; yeni hata yok.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminNav.jsx
git commit -m "feat(admin): AdminNav (sidebar + bottom-bar nav)"
```

---

## Task 2: AdminShell kabuğu

**Files:**
- Create: `src/components/admin/AdminShell.jsx`

**Interfaces:**
- Consumes: `AdminNav`, `NAV_ITEMS` (Task 1).
- Produces: `export default function AdminShell({ view, onSelectView, onLogout, headerAction, children })`.
  - `headerAction`: sağ üstte gösterilecek React düğümü (ör. "＋ Ürün") veya null.
  - `children`: aktif görünüm içeriği.

- [ ] **Step 1: Bileşeni oluştur**

```jsx
// src/components/admin/AdminShell.jsx
import AdminNav, { NAV_ITEMS } from './AdminNav';

export default function AdminShell({ view, onSelectView, onLogout, headerAction, children }) {
  const title = NAV_ITEMS.find((n) => n.id === view)?.label ?? '';
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Üst çubuk */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <span className="font-outfit font-semibold">Yönetim Paneli</span>
        <span className="text-[13px]" style={{ color: 'var(--muted)' }}>· {title}</span>
        <div className="ml-auto flex items-center gap-2">
          {headerAction}
          <a href="/" className="text-[12px] px-2.5 py-1.5 rounded-lg border no-underline" style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }}>Ana Sayfa</a>
          <button onClick={onLogout} className="text-[12px] px-2.5 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>Çıkış</button>
        </div>
      </header>

      <div className="flex max-w-[1140px] mx-auto">
        {/* Masaüstü yan menü — display tabanlı gizleme */}
        <aside className="hidden md:block w-52 flex-none p-3 border-r" style={{ borderColor: 'var(--border)' }}>
          <AdminNav view={view} onSelect={onSelectView} variant="side" />
        </aside>

        {/* İçerik — mobilde alt çubuk için padding */}
        <main className="flex-1 min-w-0 p-4 pb-24 md:pb-8">{children}</main>
      </div>

      {/* Mobil alt sekme çubuğu — display tabanlı gizleme */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <AdminNav view={view} onSelect={onSelectView} variant="bottom" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build` → hata yok.
- [ ] **Step 3: Lint** — `npm run lint` → yeni hata yok.
- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminShell.jsx
git commit -m "feat(admin): responsive AdminShell (topbar + side/bottom nav)"
```

---

## Task 3: ProductCard

**Files:**
- Create: `src/components/admin/ProductCard.jsx`

**Interfaces:**
- Produces: `export default function ProductCard({ product, category, onToggleAvailable, onEdit, onMove, onMoveTop, isFirst, isLast, showReorder })`.
  - `onToggleAvailable(product, next)`, `onEdit(product)`, `onMove(product, dir)`, `onMoveTop(product)` — imzalar Task 4/5 ile aynı.
  - `category`: ürünün kategori objesi (rozet için) veya undefined.
  - `showReorder`: bool — ▲▼ + "En üste" yalnız tek-kategori görünümünde true.
- Not: `Aktif`/`Pasif` ve `Düzenle` düğme adları AYNEN korunur (e2e).

- [ ] **Step 1: Bileşeni oluştur**

```jsx
// src/components/admin/ProductCard.jsx
function priceText(p) {
  if (p.is_market_price) return 'Piyasa Fiyatı';
  const vs = p.variants || [];
  if (vs.length) {
    const ps = vs.map((v) => v.price);
    const min = Math.min(...ps), max = Math.max(...ps);
    return min === max ? `${min} TL` : `${min}–${max} TL`;
  }
  return `${p.price ?? '—'} TL`;
}

export default function ProductCard({ product, category, onToggleAvailable, onEdit, onMove, onMoveTop, isFirst, isLast, showReorder }) {
  const active = product.is_available === 1;
  const arrow = 'w-6 h-5 flex items-center justify-center text-[10px] leading-none disabled:opacity-25';
  return (
    <div
      className="flex items-center gap-2.5 p-3 rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', opacity: active ? 1 : 0.55 }}
    >
      {showReorder && (
        <div className="flex flex-col -my-1" style={{ color: 'var(--muted)' }}>
          <button className={arrow} onClick={() => onMove(product, -1)} disabled={isFirst} aria-label="yukarı taşı">▲</button>
          <button className={arrow} onClick={() => onMove(product, 1)} disabled={isLast} aria-label="aşağı taşı">▼</button>
        </div>
      )}
      {product.image_url ? (
        <img src={product.image_url} alt="" loading="lazy" className="flex-none w-11 h-11 rounded-lg object-cover border" style={{ borderColor: 'var(--border)' }} />
      ) : (
        <div className="flex-none w-11 h-11 rounded-lg border" style={{ background: 'repeating-linear-gradient(135deg, var(--thumb-a) 0 5px, var(--thumb-b) 5px 10px)', borderColor: 'var(--border)' }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-outfit text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
          {product.name_tr}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {category && (
            <span className="text-[10.5px] px-1.5 py-0.5 rounded" style={{ background: 'var(--gold-tint)', color: 'var(--muted)' }}>{category.name_tr}</span>
          )}
          <span className="text-[12px]" style={{ color: 'var(--gold)' }}>{priceText(product)}</span>
          {product.popular ? <span className="text-[10px]" style={{ color: 'var(--muted)' }}>★ Popüler</span> : null}
          {product.chef ? <span className="text-[10px]" style={{ color: 'var(--muted)' }}>👨‍🍳 Şef</span> : null}
        </div>
      </div>
      {showReorder && !isFirst && (
        <button onClick={() => onMoveTop(product)} className="text-[11px] px-2 py-1 rounded-lg border whitespace-nowrap" style={{ borderColor: 'var(--border-strong)', color: 'var(--muted)' }}>En üste</button>
      )}
      <button
        onClick={() => onToggleAvailable(product, active ? 0 : 1)}
        className="text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap"
        style={{ borderColor: 'var(--border-strong)', color: active ? 'var(--gold)' : 'var(--muted)' }}
      >
        {active ? 'Aktif' : 'Pasif'}
      </button>
      <button onClick={() => onEdit(product)} className="text-[12px] px-3 py-1.5 rounded-lg font-medium" style={{ background: 'var(--gold-tint)', color: 'var(--gold)' }}>
        Düzenle
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build` → hata yok.
- [ ] **Step 3: Lint** — `npm run lint` → yeni hata yok.
- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ProductCard.jsx
git commit -m "feat(admin): ProductCard (kategori rozeti, fiyat aralığı, reorder)"
```

---

## Task 4: ProductsView (arama + filtre + liste)

**Files:**
- Create: `src/components/admin/ProductsView.jsx`

**Interfaces:**
- Consumes: `ProductCard` (Task 3).
- Produces: `export default function ProductsView({ categories, products, onEdit, onReload, onError })`.
  - `products`: `GET /admin/menu` ürünleri (variants dahil, `sort`'a göre gelir).
  - `onReload()`: veri yeniden yükler. `onError(msg)`: hata bildirir.
  - Reorder ve toggle mantığı burada; `api` doğrudan kullanılır.
- Not: TR-duyarsız arama için basit normalize (`İ/I/ş/ğ/ü/ö/ç` → ascii, lowercase).

- [ ] **Step 1: Bileşeni oluştur**

```jsx
// src/components/admin/ProductsView.jsx
import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import ProductCard from './ProductCard';

const norm = (s) => (s || '').toLowerCase()
  .replace(/i̇/g, 'i').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
  .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

export default function ProductsView({ categories, products, onEdit, onReload, onError }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');      // 'all' | category id
  const [status, setStatus] = useState('all'); // 'all' | 'active' | 'passive'

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    return products.filter((p) => {
      if (cat !== 'all' && p.category_id !== cat) return false;
      if (status === 'active' && p.is_available !== 1) return false;
      if (status === 'passive' && p.is_available === 1) return false;
      if (nq && !norm(p.name_tr).includes(nq) && !norm(p.name_en).includes(nq)) return false;
      return true;
    });
  }, [products, q, cat, status]);

  async function onToggleAvailable(product, next) {
    try { await api.patch(`/admin/products/${product.id}`, { is_available: next }); onReload(); }
    catch (e) { onError(e.message); }
  }

  // kategori içi komşuyla yer değiştir (mevcut desen: per-category index PATCH)
  async function onMove(product, dir) {
    const list = products.filter((p) => p.category_id === product.category_id);
    const i = list.findIndex((p) => p.id === product.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    try {
      await Promise.all(list.map((p, idx) => (p.sort !== idx ? api.patch(`/admin/products/${p.id}`, { sort: idx }) : null)).filter(Boolean));
      onReload();
    } catch (e) { onError(e.message); }
  }

  async function onMoveTop(product) {
    const list = products.filter((p) => p.category_id === product.category_id);
    const reordered = [product, ...list.filter((p) => p.id !== product.id)];
    try {
      await Promise.all(reordered.map((p, idx) => (p.sort !== idx ? api.patch(`/admin/products/${p.id}`, { sort: idx }) : null)).filter(Boolean));
      onReload();
    } catch (e) { onError(e.message); }
  }

  const chip = (active) => ({
    background: active ? 'var(--gold)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    borderColor: 'var(--border-strong)',
  });
  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none w-full';

  const showReorder = cat !== 'all'; // sıralama yalnız tek kategori görünümünde
  const singleCat = cat !== 'all';

  return (
    <div className="flex flex-col gap-3">
      {/* Sticky araç çubuğu */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-2 flex flex-col gap-2" style={{ background: 'var(--bg)' }}>
        <input className={field} style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }} placeholder="Ürün ara…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setCat('all')} className="text-[12px] px-3 py-1 rounded-full border whitespace-nowrap" style={chip(cat === 'all')}>Tümü</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className="text-[12px] px-3 py-1 rounded-full border whitespace-nowrap" style={chip(cat === c.id)}>{c.name_tr}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {[['all', 'Tümü'], ['active', 'Aktif'], ['passive', 'Pasif']].map(([v, l]) => (
            <button key={v} onClick={() => setStatus(v)} className="text-[11px] px-2.5 py-1 rounded-full border" style={chip(status === v)}>{l}</button>
          ))}
          <span className="ml-auto text-[12px]" style={{ color: 'var(--muted)' }}>{filtered.length} ürün</span>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>Sonuç yok.</p>
      ) : singleCat ? (
        <div className="flex flex-col gap-2">
          {filtered.map((p, idx) => (
            <ProductCard key={p.id} product={p} category={catById[p.category_id]} showReorder={showReorder}
              onEdit={onEdit} onToggleAvailable={onToggleAvailable} onMove={onMove} onMoveTop={onMoveTop}
              isFirst={idx === 0} isLast={idx === filtered.length - 1} />
          ))}
        </div>
      ) : (
        // "Tümü": kategoriye göre gruplu, grid geniş ekranda 2 sütun
        categories.map((c) => {
          const items = filtered.filter((p) => p.category_id === c.id);
          if (!items.length) return null;
          return (
            <section key={c.id} className="mb-1">
              <h2 className="font-outfit text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>{c.name_tr}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} category={c} showReorder={false}
                    onEdit={onEdit} onToggleAvailable={onToggleAvailable} onMove={onMove} onMoveTop={onMoveTop}
                    isFirst isLast />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build` → hata yok.
- [ ] **Step 3: Lint** — `npm run lint` → yeni hata yok.
- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ProductsView.jsx
git commit -m "feat(admin): ProductsView (arama + kategori/durum filtresi + reorder)"
```

---

## Task 5: DashboardPage'i kabuğa taşı + ProductRow'u sil

**Files:**
- Modify: `src/pages/admin/DashboardPage.jsx` (tam yeniden yazım)
- Delete: `src/components/admin/ProductRow.jsx`

**Interfaces:**
- Consumes: `AdminShell` (Task 2), `ProductsView` (Task 4), mevcut `CategoryForm/InfoPanel/HistoryPanel/QrPanel`, `ProductForm`.
- Not: Giriş sonrası `Yönetim Paneli` metni `AdminShell` üst çubuğunda kalır (e2e). `editing` varken ProductForm tam-ekran içerik olarak gösterilir.

- [ ] **Step 1: DashboardPage'i yeniden yaz**

```jsx
// src/pages/admin/DashboardPage.jsx
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThemeVars } from '../../lib/theme';
import { api } from '../../lib/api';
import AdminShell from '../../components/admin/AdminShell';
import ProductsView from '../../components/admin/ProductsView';
import ProductForm from '../../components/admin/ProductForm';
import CategoryForm from '../../components/admin/CategoryForm';
import InfoPanel from '../../components/admin/InfoPanel';
import HistoryPanel from '../../components/admin/HistoryPanel';
import Toast from '../../components/Toast';

const QrPanel = import.meta.env.VITE_STATIC === '1' ? null : lazy(() => import('../../components/admin/QrPanel'));

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const vars = getThemeVars(true, '#C8902F');

  const [view, setView] = useState('products');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // ürün | 'new' | null
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((text) => {
    setToast(text); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const reload = useCallback(async () => {
    try { const data = await api.get('/admin/menu'); setCategories(data.categories); setProducts(data.products); }
    catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function onLogout() { await logout(); navigate('/admin/login', { replace: true }); }

  const headerAction = view === 'products' && !editing
    ? <button onClick={() => setEditing('new')} className="text-[12px] px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'var(--gold)', color: '#fff' }}>＋ Ürün</button>
    : null;

  return (
    <div style={vars}>
      <AdminShell view={view} onSelectView={(v) => { setView(v); setEditing(null); }} onLogout={onLogout} headerAction={headerAction}>
        {error && <p className="text-sm mb-2" style={{ color: '#ef6b6b' }}>{error}</p>}

        {editing ? (
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onSaved={() => { reload(); showToast('Kaydedildi'); }}
            onCancel={() => setEditing(null)}
            onDeleted={() => { setEditing(null); reload(); showToast('Ürün silindi'); }}
          />
        ) : view === 'products' ? (
          <ProductsView categories={categories} products={products} onEdit={setEditing} onReload={reload} onError={setError} />
        ) : view === 'categories' ? (
          <CategoryForm categories={categories} onChanged={() => { reload(); showToast('Güncellendi'); }} />
        ) : view === 'info' ? (
          <InfoPanel />
        ) : view === 'history' ? (
          <HistoryPanel />
        ) : view === 'qr' && QrPanel ? (
          <Suspense fallback={<p className="text-sm" style={{ color: 'var(--muted)' }}>QR yükleniyor…</p>}><QrPanel /></Suspense>
        ) : null}

        <Toast text={toast} />
      </AdminShell>
    </div>
  );
}
```

- [ ] **Step 2: ProductRow'u sil**

```bash
git rm src/components/admin/ProductRow.jsx
```

- [ ] **Step 3: Build** — `npm run build` → hata yok (ProductRow'a kalan referans olmamalı).
- [ ] **Step 4: Lint** — `npm run lint` → yeni hata yok.
- [ ] **Step 5: e2e (regresyon)** — `npm run test:e2e`
  Expected: tüm testler PASS. (Özellikle fiyat düzenleme, kategori yeniden adlandırma, nav `Kategoriler`.)
  Kırılırsa: seçici uyumunu düzelt (buton adları/placeholder'lar) — kabuk metinleri Global Constraints'e uymalı.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(admin): DashboardPage'i AdminShell + ProductsView'e taşı, ProductRow kaldır"
```

---

## Task 6: ProductForm'u bölümlere ayır (2 sütun)

**Files:**
- Create: `src/components/admin/Section.jsx`
- Modify: `src/components/admin/ProductForm.jsx`

**Interfaces:**
- Produces: `export default function Section({ title, children, defaultOpen = true, collapsible = false })`.
- Not: TÜM mevcut alanlar/placeholder'lar/düğmeler AYNEN kalır (e2e: `Ad (TR)`, `Fiyat (TL)`, `الاسم (AR)`, `+ Varyant ekle`, `Kaydet`, `İptal`, katlanır başlık `Çeviriler (Arapça / Rusça)`). Sadece kapsayıcı düzen değişir.

- [ ] **Step 1: Section bileşenini oluştur**

```jsx
// src/components/admin/Section.jsx
import { useState } from 'react';

export default function Section({ title, children, defaultOpen = true, collapsible = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border p-3.5 flex flex-col gap-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {collapsible ? (
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full text-left">
          <span className="font-outfit text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
          <span style={{ color: 'var(--muted)' }}>{open ? '▾' : '▸'}</span>
        </button>
      ) : (
        <span className="font-outfit text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
      )}
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 2: ProductForm düzenini bölümlere sar**

Mevcut `ProductForm.jsx`'te dönen JSX'i şu iskeletle sar. **Alanların kendisi (input/select/textarea/varyant editörü/ImageUploader) birebir korunur** — yalnızca `Section` sarmalayıcılarına ve masaüstü 2 sütun grid'e yerleştirilir. Katlanır Çeviriler bölümünün başlığı tam `Çeviriler (Arapça / Rusça)` olmalı.

Formun en dış sarmalayıcısı:

```jsx
<form onSubmit={onSubmit} className="flex flex-col gap-3 pb-20">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <Section title="Temel">
      {/* kategori select, Ad (TR), Ad (EN), Açıklama (TR), Açıklama (EN), İçindekiler/Alerjenler TR-EN */}
    </Section>
    <Section title="Fiyat & Porsiyon">
      {/* Piyasa Fiyatı checkbox, Fiyat (TL), Kalori, Porsiyon miktar+birim */}
    </Section>
    <Section title="Varyantlar">
      {/* mevcut varyant listesi + "+ Varyant ekle" */}
    </Section>
    <Section title="Görseller">
      {/* <ImageUploader ... /> */}
    </Section>
    <Section title="Çeviriler (Arapça / Rusça)" collapsible defaultOpen={false}>
      {/* name_ar/name_ru, desc_ar/desc_ru, ing_ar/ru, alg_ar/ru */}
    </Section>
    <Section title="Etiketler">
      {/* Glütensiz, Vejetaryen, Popüler, Şef önerisi, Stokta */}
    </Section>
  </div>

  {/* Sabit alt aksiyon çubuğu */}
  <div className="fixed bottom-0 inset-x-0 z-30 border-t px-4 py-2.5 flex gap-2 md:pl-56"
    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
    <button type="submit" className="px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--gold)', color: '#fff' }}>Kaydet</button>
    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>İptal</button>
    {savedProductHasId && <button type="button" onClick={onDelete} className="ml-auto px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--border-strong)', color: '#ef6b6b' }}>Sil</button>}
    {error && <span className="self-center text-sm" style={{ color: '#ef6b6b' }}>{error}</span>}
  </div>
</form>
```

Notlar:
- `Section`'ı import et: `import Section from './Section';`
- Var olan state, `onSubmit`, `onDelete`, `set()`, varyant/porsiyon yardımcıları, `ImageUploader` kullanımı DEĞİŞMEZ — sadece taşınır.
- Önceki katlanır "Çeviriler" mantığı bir `useState` ile yönetiliyorsa, `Section collapsible` onu devralır; eski toggle kodu kaldırılır.
- Eski tekil `<button>Kaydet</button>` vb. alt çubuğa taşınır; formda tekrarı bırakılmaz.

- [ ] **Step 3: Build** — `npm run build` → hata yok.
- [ ] **Step 4: Lint** — `npm run lint` → yeni hata yok.
- [ ] **Step 5: e2e (form akışları)** — `npm run test:e2e`
  Expected: PASS — özellikle `admin can add an Arabic name…` (Çeviriler başlığına tıklama), `admin can add portion variants…` (+ Varyant ekle), fiyat düzenleme.
  Kırılırsa: başlık/placeholder/düğme adlarını Global Constraints'e göre düzelt.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/Section.jsx src/components/admin/ProductForm.jsx
git commit -m "feat(admin): ProductForm bölümlü + 2 sütun düzen, sabit aksiyon çubuğu"
```

---

## Task 7: Bütünsel doğrulama + export + push

**Files:** (kod değişikliği yok; doğrulama + artefakt)

- [ ] **Step 1: Tam test paketi**

Run: `npm run test:server` → 54/54 PASS (API değişmedi).
Run: `npm run test:e2e` → tümü PASS.

- [ ] **Step 2: Manuel responsive kontrol (kısa)**

- Tarayıcıyı daralt (mobil): üst çubuk + alt sekme; arama/filtre çalışıyor; kart dokunma hedefleri rahat.
- Genişlet (masaüstü): yan menü görünür, alt sekme yok; "Tümü"de 2 sütun grid; tek kategoride ▲▼/En üste görünür.
- Form: bölümler + sabit alt çubuk; Çeviriler katlanır.

- [ ] **Step 3: Statik export'u yenile**

Run: `npm run export:menu`
Expected: `menu-data.json yazıldı: 12 kategori, 199 ürün`; www/menu güncellendi.

- [ ] **Step 4: Commit + push**

```bash
git add www/menu/
git commit -m "chore: admin yeniden tasarımı sonrası statik menü export'u yenile"
git push
```

---

## Self-Review (plan ↔ spec)

- **Spec kapsamı:** Kabuk (T2), nav sidebar+bottom (T1), ürün arama/filtre/sayaç (T4), ProductCard (T3), reorder tek-kategori (T4), form bölümleri + 2 sütun + sabit çubuk (T6), diğer görünümler mevcut bileşenlerle (T5), export (T7) → hepsi karşılandı.
- **Placeholder taraması:** Kod blokları gerçek; "TBD/uygun şekilde" yok. T6'da alan içerikleri "birebir korunur" talimatıyla mevcut dosyadan taşınıyor (yeni kod uydurulmuyor).
- **Tip/isim tutarlılığı:** `onMove(product,dir)`, `onMoveTop(product)`, `onToggleAvailable(product,next)`, `onEdit(product)` T3/T4/T5 arasında aynı. `NAV_ITEMS`/`AdminNav({view,onSelect,variant})` T1↔T2 uyumlu. `AdminShell({view,onSelectView,onLogout,headerAction,children})` T2↔T5 uyumlu.
- **e2e seçicileri:** Global Constraints'te listelendi; T5 ve T6 adımları e2e ile doğruluyor.
