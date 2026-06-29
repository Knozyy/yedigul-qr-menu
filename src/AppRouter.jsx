import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/masa/:id" element={<MenuPage />} />
      {/* admin rotaları Task 12'de eklenir */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
