import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import AdminShell from '../../components/admin/AdminShell';
import ProductsView from '../../components/admin/ProductsView';
import ProductForm from '../../components/admin/ProductForm';
import CategoryForm from '../../components/admin/CategoryForm';
import InfoPanel from '../../components/admin/InfoPanel';
import Toast from '../../components/Toast';

const QrPanel = import.meta.env.VITE_STATIC === '1' ? null : lazy(() => import('../../components/admin/QrPanel'));

function dateLine() {
  const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const t = new Date();
  return t.getDate() + ' ' + AY[t.getMonth()] + ' ' + t.getFullYear() + ', ' + GUN[t.getDay()];
}

const TITLES = {
  home: ['Genel Bakış', dateLine()],
  items: ['Ürünler', 'Menüdeki ürünleri ekleyin, düzenleyin, gizleyin'],
  cats: ['Kategoriler', 'Menü bölümlerini sıralayın ve adlandırın'],
  settings: ['Ayarlar', 'Duyuru, Wi-Fi ve işletme bilgileri'],
  qr: ['QR Kod', 'Masa kartları için menü kodu'],
};

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState('home');
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

  const [pageTitle, pageSub] = TITLES[view] || TITLES.home;

  return (
    <AdminShell view={view} onSelectView={(v) => { setView(v); setEditing(null); }} onLogout={onLogout}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 31, fontWeight: 600, lineHeight: 1.1 }}>{pageTitle}</h2>
        <span style={{ fontSize: 13.5, color: 'var(--muted)', letterSpacing: 0.3 }}>{pageSub}</span>
      </div>

      {error && <p className="text-sm mb-2" style={{ color: '#ef6b6b' }}>{error}</p>}

      {editing ? (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories}
          onSaved={() => { reload(); showToast('Kaydedildi'); }}
          onCancel={() => setEditing(null)}
          onDeleted={() => { setEditing(null); reload(); showToast('Ürün silindi'); }}
        />
      ) : view === 'items' ? (
        <ProductsView categories={categories} products={products} onEdit={setEditing} onReload={reload} onError={setError} onAdd={() => setEditing('new')} />
      ) : view === 'cats' ? (
        <CategoryForm categories={categories} products={products} onChanged={() => { reload(); showToast('Güncellendi'); }} />
      ) : view === 'settings' ? (
        <InfoPanel />
      ) : view === 'qr' && QrPanel ? (
        <Suspense fallback={<p className="text-sm" style={{ color: 'var(--muted)' }}>QR yükleniyor…</p>}><QrPanel /></Suspense>
      ) : view === 'home' ? (
        <div style={{ padding: '40px 8px', color: 'var(--muted)', fontSize: 14 }}>Genel Bakış hazırlanıyor…</div>
      ) : null}

      <Toast text={toast} />
    </AdminShell>
  );
}
