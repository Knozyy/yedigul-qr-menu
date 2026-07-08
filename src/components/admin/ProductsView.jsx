import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import ProductCard from './ProductCard';

const norm = (s) => (s || '').toLowerCase()
  .replace(/i̇/g, 'i').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
  .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

export default function ProductsView({ categories, products, onEdit, onReload, onError }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');      // 'all' | category id
  const [status, setStatus] = useState('all'); // 'all' | 'active' | 'passive'

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    return products.filter((p) => {
      if (cat !== 'all' && p.category_id !== cat) return false;
      if (status === 'active' && p.is_available !== 1) return false;
      if (status === 'passive' && p.is_available === 1) return false;
      if (nq && !norm(p.name_tr).includes(nq) && !norm(p.name_en).includes(nq)) return false;
      return true;
    });
  }, [products, q, cat, status]);

  async function onToggleAvailable(product, next) {
    try { await api.patch(`/admin/products/${product.id}`, { is_available: next }); onReload(); }
    catch (e) { onError(e.message); }
  }

  // kategori içi komşuyla yer değiştir (mevcut desen: per-category index PATCH)
  async function onMove(product, dir) {
    const list = products.filter((p) => p.category_id === product.category_id);
    const i = list.findIndex((p) => p.id === product.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    try {
      await Promise.all(list.map((p, idx) => (p.sort !== idx ? api.patch(`/admin/products/${p.id}`, { sort: idx }) : null)).filter(Boolean));
      onReload();
    } catch (e) { onError(e.message); }
  }

  async function onMoveTop(product) {
    const list = products.filter((p) => p.category_id === product.category_id);
    const reordered = [product, ...list.filter((p) => p.id !== product.id)];
    try {
      await Promise.all(reordered.map((p, idx) => (p.sort !== idx ? api.patch(`/admin/products/${p.id}`, { sort: idx }) : null)).filter(Boolean));
      onReload();
    } catch (e) { onError(e.message); }
  }

  const chip = (active) => ({
    background: active ? 'var(--gold)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    borderColor: 'var(--border-strong)',
  });
  const field = 'px-3 py-2 rounded-lg border bg-transparent outline-none w-full';

  const showReorder = cat !== 'all'; // sıralama yalnız tek kategori görünümünde
  const singleCat = cat !== 'all';

  return (
    <div className="flex flex-col gap-3">
      {/* Sticky araç çubuğu */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-2 flex flex-col gap-2" style={{ background: 'var(--bg)' }}>
        <input className={field} style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }} placeholder="Ürün ara…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setCat('all')} className="text-[12px] px-3 py-1 rounded-full border whitespace-nowrap" style={chip(cat === 'all')}>Tümü</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className="text-[12px] px-3 py-1 rounded-full border whitespace-nowrap" style={chip(cat === c.id)}>{c.name_tr}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {[['all', 'Tümü'], ['active', 'Aktif'], ['passive', 'Pasif']].map(([v, l]) => (
            <button key={v} onClick={() => setStatus(v)} className="text-[11px] px-2.5 py-1 rounded-full border" style={chip(status === v)}>{l}</button>
          ))}
          <span className="ml-auto text-[12px]" style={{ color: 'var(--muted)' }}>{filtered.length} ürün</span>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>Sonuç yok.</p>
      ) : singleCat ? (
        <div className="flex flex-col gap-2">
          {filtered.map((p, idx) => (
            <ProductCard key={p.id} product={p} category={catById[p.category_id]} showReorder={showReorder}
              onEdit={onEdit} onToggleAvailable={onToggleAvailable} onMove={onMove} onMoveTop={onMoveTop}
              isFirst={idx === 0} isLast={idx === filtered.length - 1} />
          ))}
        </div>
      ) : (
        // "Tümü": kategoriye göre gruplu, grid geniş ekranda 2 sütun
        categories.map((c) => {
          const items = filtered.filter((p) => p.category_id === c.id);
          if (!items.length) return null;
          return (
            <section key={c.id} className="mb-1">
              <h2 className="font-outfit text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>{c.name_tr}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} category={c} showReorder={false}
                    onEdit={onEdit} onToggleAvailable={onToggleAvailable} onMove={onMove} onMoveTop={onMoveTop}
                    isFirst isLast />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
