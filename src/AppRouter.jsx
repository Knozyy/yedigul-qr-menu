import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import { useAuth } from './context/AuthContext';

// statik export'ta (hosting) API yok — admin rotaları pakete hiç girmesin.
// import.meta.env build'de sabite döner, ölü dal + admin sayfaları elenir.
const IS_STATIC = import.meta.env.VITE_STATIC === '1';

function RequireAuth({ children }) {
  const { authed, ready } = useAuth();
  if (!ready) return null;
  if (!authed) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      {!IS_STATIC && <Route path="/admin/login" element={<LoginPage />} />}
      {!IS_STATIC && <Route path="/admin" element={<RequireAuth><DashboardPage /></RequireAuth>} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
