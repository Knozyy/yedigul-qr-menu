import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Statik ve public üretim build'lerinde admin yok — oturum kontrolü yapma.
    if (import.meta.env.VITE_ADMIN_ENABLED !== '1') {
      setReady(true);
      return;
    }
    api.get('/auth/me')
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (password) => {
    await api.post('/auth/login', { password });
    setAuthed(true);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authed, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
