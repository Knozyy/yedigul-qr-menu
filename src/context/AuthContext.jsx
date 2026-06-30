import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
