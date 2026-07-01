import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import { useAuth } from './context/AuthContext';

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
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
