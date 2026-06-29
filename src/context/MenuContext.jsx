import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const MenuContext = createContext(null);
const POLL_MS = 30000;

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const firstLoad = useRef(true);

  const reload = useCallback(async () => {
    try {
      const data = await api.get('/menu');
      setCategories(data.categories);
      setItems(data.products);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      if (firstLoad.current) {
        firstLoad.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    reload();
    const t = setInterval(reload, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  return (
    <MenuContext.Provider value={{ categories, items, loading, error, reload }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}
