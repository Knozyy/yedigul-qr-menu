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
