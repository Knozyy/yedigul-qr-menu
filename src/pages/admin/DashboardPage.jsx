import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThemeVars } from '../../lib/theme';
import { api } from '../../lib/api';
import ProductRow from '../../components/admin/ProductRow';
import ProductForm from '../../components/admin/ProductForm';
import CategoryForm from '../../components/admin/CategoryForm';

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const vars = getThemeVars(true, '#C8902F');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // ürün objesi | 'new' | null
  const [showCategories, setShowCategories] = useState(false);

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
            <button onClick={() => setShowCategories((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
              Kategoriler
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
            onSaved={() => reload()}
            onCancel={() => setEditing(null)}
            onDeleted={() => { setEditing(null); reload(); }}
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

        {showCategories && !editing && (
          <CategoryForm categories={categories} onChanged={reload} />
        )}

        {!editing && categories.map((cat) => (
          <section key={cat.id} className="mb-5">
            <h2 className="font-outfit text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              {cat.name_tr}
            </h2>
            <div className="flex flex-col gap-2">
              {products.filter((p) => p.category_id === cat.id).map((p) => (
                <ProductRow key={p.id} product={p} onToggleAvailable={onToggleAvailable} onEdit={onEdit} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
