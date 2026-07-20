import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { getDeviceId } from '../lib/deviceId';

const MenuContext = createContext(null);
const POLL_MS = 30000;
// static export mode: menu data is baked into the bundle as a JSON file
// (no backend on the shared host), so there is nothing to poll
const IS_STATIC = import.meta.env.VITE_STATIC === '1';

const EMPTY_META = {
  announcement: { tr: '', en: '', ar: '', ru: '' },
  info: { phone: '', hours: '', wifi: '', instagram: '' },
  price_updated_at: '',
};

function normalizeMeta(meta) {
  return {
    ...EMPTY_META,
    ...(meta || {}),
    announcement: { ...EMPTY_META.announcement, ...(meta?.announcement || {}) },
    info: { ...EMPTY_META.info, ...(meta?.info || {}) },
  };
}

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const firstLoad = useRef(true);

  const reload = useCallback(async () => {
    try {
      let data;
      if (IS_STATIC) {
        const res = await fetch(`${import.meta.env.BASE_URL}menu-data.json`);
        if (!res.ok) throw new Error(`Menü yüklenemedi (${res.status})`);
        data = await res.json();
      } else {
        data = await api.get('/menu');
      }
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setItems(Array.isArray(data.products) ? data.products : []);
      setMeta(normalizeMeta(data.meta));
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
    if (IS_STATIC) return undefined;
    const t = setInterval(reload, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  // Cihaz başına görüntülenme kaydı: uygulama açılışında bir kez pinglenir.
  // 6 saatlik tekrarsızlığı sunucu uygular; polling'deki reload SAYMAZ.
  useEffect(() => {
    if (IS_STATIC) return;
    api.post('/menu/view', { id: getDeviceId() }).catch(() => {});
  }, []);

  return (
    <MenuContext.Provider value={{ categories, items, meta, loading, error, reload }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}
