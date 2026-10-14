import { useCallback, useEffect, useState } from 'react';
import { api } from './lib/api.js';
import Shell from './components/Shell.jsx';
import { LoginGate } from './components/LoginGate.jsx';
import Pano from './views/Pano.jsx';
import DailyPrices from './views/DailyPrices.jsx';
import Products from './views/Products.jsx';
import Categories from './views/Categories.jsx';
import FixMenus from './views/FixMenus.jsx';
import Feedback from './views/Feedback.jsx';
import Settings from './views/Settings.jsx';

export default function App() {
  const [boot, setBoot] = useState(null);
  const [menu, setMenu] = useState({ categories: [], products: [], sets: [] });
  const [panel, setPanel] = useState(null);
  const [active, setActive] = useState('pano');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refreshBoot = useCallback(async () => {
    const data = await api.bootstrap();
    setBoot(data);
    return data;
  }, []);

  const reloadMenu = useCallback(async () => {
    const data = await api.get('/admin/menu');
    setMenu(data);
    return data;
  }, []);

  // Pano verisi menüden bağımsız çekilir: bir konektör düşse bile menü
  // yönetimi etkilenmemeli, tersi de geçerli.
  const reloadPanel = useCallback(async () => {
    try {
      setPanel(await api.get('/panel'));
    } catch {
      // Panel çekilemedi; menü yönetimi çalışmaya devam eder.
    }
  }, []);

  useEffect(() => {
    refreshBoot()
      .then((data) => (data.authenticated ? Promise.all([reloadMenu(), reloadPanel()]) : null))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshBoot, reloadMenu, reloadPanel]);

  // Pano açıkken dakikada bir tazelenir; diğer ekranlarda boşuna istek atılmaz.
  useEffect(() => {
    if (!boot?.authenticated || active !== 'pano') return undefined;
    const timer = setInterval(reloadPanel, 60 * 1000);
    return () => clearInterval(timer);
  }, [boot?.authenticated, active, reloadPanel]);

  async function login(password) {
    setError('');
    try { await api.post('/session/login', { password }); const data = await refreshBoot(); await Promise.all([reloadMenu(), reloadPanel()]); setBoot({ ...data, authenticated: true }); }
    catch (e) { setError(e.message); }
  }

  async function logout() {
    await api.post('/session/logout').catch(() => {});
    setMenu({ categories: [], products: [], sets: [] });
    setPanel(null);
    setActive('pano');
    await refreshBoot();
  }

  const request = useCallback(async (method, path, body) => {
    try { return await api[method](path, body); }
    catch (e) {
      if (e.status === 401) {
        setBoot((old) => ({ ...old, authenticated: false }));
        setError('Canlı yönetim oturumunun süresi doldu. Yeniden giriş yapın.');
      }
      throw e;
    }
  }, []);

  if (loading) return <div className="splash"><span className="brand-mark large">Y</span><p>Yönetim paneli hazırlanıyor…</p></div>;
  if (!boot) return <div className="splash error-splash"><h1>Uygulama başlatılamadı</h1><p>{error}</p><button className="primary-button" onClick={() => window.location.reload()}>Yeniden dene</button></div>;

  if (!boot.authenticated) return <LoginGate onLogin={login} error={error} />;

  const views = {
    pano: <Pano menu={menu} panel={panel} onSynced={reloadPanel} />,
    prices: <DailyPrices menu={menu} onReload={reloadMenu} request={request} />,
    products: <Products menu={menu} onReload={reloadMenu} request={request} publicMenuUrl={boot.publicMenuUrl} />,
    categories: <Categories menu={menu} onReload={reloadMenu} request={request} />,
    sets: <FixMenus menu={menu} onReload={reloadMenu} request={request} />,
    feedback: <Feedback request={request} />,
    settings: <Settings request={request} />,
  };
  return <Shell active={active} onSelect={setActive} onLogout={logout} publicMenuUrl={boot.publicMenuUrl}>{views[active]}</Shell>;
}
