import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
