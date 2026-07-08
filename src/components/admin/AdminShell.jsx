import AdminNav, { NAV_ITEMS } from './AdminNav';

export default function AdminShell({ view, onSelectView, onLogout, headerAction, children }) {
  const title = NAV_ITEMS.find((n) => n.id === view)?.label ?? '';
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Üst çubuk */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <span className="font-outfit font-semibold">Yönetim Paneli</span>
        <span className="text-[13px]" style={{ color: 'var(--muted)' }}>· {title}</span>
        <div className="ml-auto flex items-center gap-2">
          {headerAction}
          <a href="/" className="text-[12px] px-2.5 py-1.5 rounded-lg border no-underline" style={{ borderColor: 'var(--border-strong)', color: 'var(--text)' }}>Ana Sayfa</a>
          <button onClick={onLogout} className="text-[12px] px-2.5 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>Çıkış</button>
        </div>
      </header>

      <div className="flex max-w-[1140px] mx-auto">
        {/* Masaüstü yan menü — display tabanlı gizleme */}
        <aside className="hidden md:block w-52 flex-none p-3 border-r" style={{ borderColor: 'var(--border)' }}>
          <AdminNav view={view} onSelect={onSelectView} variant="side" />
        </aside>

        {/* İçerik — mobilde alt çubuk için padding */}
        <main className="flex-1 min-w-0 p-4 pb-24 md:pb-8">{children}</main>
      </div>

      {/* Mobil alt sekme çubuğu — display tabanlı gizleme */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <AdminNav view={view} onSelect={onSelectView} variant="bottom" />
      </div>
    </div>
  );
}
