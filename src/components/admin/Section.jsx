import { useState } from 'react';

export default function Section({ title, children, defaultOpen = true, collapsible = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border p-3.5 flex flex-col gap-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {collapsible ? (
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full text-left">
          <span className="font-outfit text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
          <span style={{ color: 'var(--muted)' }}>{open ? '▾' : '▸'}</span>
        </button>
      ) : (
        <span className="font-outfit text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
      )}
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}
