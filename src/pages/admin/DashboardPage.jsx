import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getThemeVars } from '../../lib/theme';

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const vars = getThemeVars(true, '#C8902F');

  async function onLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen" style={{ ...vars, background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-[640px] mx-auto p-4">
        <header className="flex items-center justify-between mb-4">
          <h1 className="font-outfit text-lg font-semibold">Yönetim Paneli</h1>
          <button onClick={onLogout} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
            Çıkış
          </button>
        </header>
        {/* ürün/kategori yönetimi Task 13-15'te eklenir */}
      </div>
    </div>
  );
}
