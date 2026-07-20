import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { useAuth } from '../../context/auth-context.js';
import DashboardPage from './DashboardPage';
import LoginPage from './LoginPage';

function RequireAuth({ children }) {
  const { authed, ready } = useAuth();
  if (!ready) return null;
  if (!authed) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function AdminRouter() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route index element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
}
