import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';

// statik export'ta (hosting) API yok — admin rotaları pakete hiç girmesin.
// import.meta.env build'de sabite döner, ölü dal + admin sayfaları elenir.
const ADMIN_ENABLED = import.meta.env.VITE_ADMIN_ENABLED === '1';
const AdminRouter = ADMIN_ENABLED ? lazy(() => import('./pages/admin/AdminRouter')) : null;

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      {ADMIN_ENABLED && <Route path="/admin/*" element={<Suspense fallback={null}><AdminRouter /></Suspense>} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
