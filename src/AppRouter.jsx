import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';

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
