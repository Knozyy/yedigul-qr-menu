import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThemeVars } from '../../lib/theme';
import { api } from '../../lib/api';
import ProductRow from '../../components/admin/ProductRow';
import ProductForm from '../../components/admin/ProductForm';
import CategoryForm from '../../components/admin/CategoryForm';
import InfoPanel from '../../components/admin/InfoPanel';
import HistoryPanel from '../../components/admin/HistoryPanel';
import Toast from '../../components/Toast';

// qrcode kütüphanesini yalnız QR bölümü açıldığında yükle (ayrı parça).
// Statik export'ta (VITE_STATIC=1) bu dal derleme zamanında elenir; böylece
// QrPanel + qrcode parçası müşteriye giden pakete HİÇ üretilmez.
const QrPanel = import.meta.env.VITE_STATIC === '1'
  ? null
  : lazy(() => import('../../components/admin/QrPanel'));

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const vars = getThemeVars(true, '#C8902F');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // ürün objesi | 'new' | null
  const [showCategories, setShowCategories] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const reload = useCallback(async () => {
    try {
      const data = await api.get('/admin/menu');
      setCategories(data.categories);
      setProducts(data.products);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const onToggleAvailable = useCallback(async (product, next) => {
    try {
      await api.patch(`/admin/products/${product.id}`, { is_available: next });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }, [reload]);

  const onEdit = useCallback((product) => setEditing(product), []);

  // reorder within the product's category: swap with neighbour, persist
  // per-category indexes (only rows whose sort actually changed are PATCHed)
  const onMoveProduct = useCallback(async (product, dir) => {
    const list = products.filter((p) => p.category_id === product.category_id);
    const i = list.findIndex((p) => p.id === product.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    try {
      await Promise.all(
        list
          .map((p, idx) => (p.sort !== idx ? api.patch(`/admin/products/${p.id}`, { sort: idx }) : null))
          .filter(Boolean)
      );
      reload();
    } catch (e) {
      setError(e.message);
    }
  }, [products, reload]);

  async function onLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen" style={{ ...vars, background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-[640px] mx-auto p-4">
        <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h1 className="font-outfit text-lg font-semibold">Yönetim Paneli</h1>
          <div className="flex gap-2">
            <a href="/" className="text-sm px-3 py-1.5 rounded-lg border no-underline" style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }}>
              Ana Sayfa
            </a>
            <button onClick={() => setShowCategories((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
              Kategoriler
            </button>
            <button onClick={() => setShowInfo((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
              Bilgiler
            </button>
            <button onClick={() => setShowHistory((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
              Geçmiş
            </button>
            <button onClick={() => setShowQr((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
              QR Kod
            </button>
            <button onClick={onLogout} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
              Çıkış
            </button>
          </div>
        </header>
        {error && <p className="text-sm mb-2" style={{ color: '#ef6b6b' }}>{error}</p>}

        {editing ? (
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onSaved={() => { reload(); showToast('Kaydedildi'); }}
            onCancel={() => setEditing(null)}
            onDeleted={() => { setEditing(null); reload(); showToast('Ürün silindi'); }}
          />
        ) : (
          <button
            onClick={() => setEditing('new')}
            className="mb-4 px-4 py-2 rounded-lg font-semibold"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            + Yeni ürün
          </button>
        )}

        {showQr && !editing && QrPanel && (
          <Suspense fallback={<p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>QR yükleniyor…</p>}>
            <QrPanel />
          </Suspense>
        )}

        {showInfo && !editing && <InfoPanel />}

        {showHistory && !editing && <HistoryPanel />}

        {showCategories && !editing && (
          <CategoryForm categories={categories} onChanged={() => { reload(); showToast('Güncellendi'); }} />
        )}

        {!editing && categories.map((cat) => (
          <section key={cat.id} className="mb-5">
            <h2 className="font-outfit text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              {cat.name_tr}
            </h2>
            <div className="flex flex-col gap-2">
              {products.filter((p) => p.category_id === cat.id).map((p, idx, list) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onToggleAvailable={onToggleAvailable}
                  onEdit={onEdit}
                  onMove={onMoveProduct}
                  isFirst={idx === 0}
                  isLast={idx === list.length - 1}
                />
              ))}
            </div>
          </section>
        ))}

        <Toast text={toast} />
      </div>
    </div>
  );
}
