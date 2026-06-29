export default function Toast({ text }) {
  if (!text) return null;

  return (
    <div
      className="yg-anim-toast fixed left-1/2 bottom-[34px] z-[80] flex items-center gap-2.5 px-5 py-[13px] rounded-[14px] border font-inter text-[13.5px] font-medium whitespace-nowrap"
      style={{
        background: 'var(--surface)',
        color: 'var(--text)',
        borderColor: 'var(--gold-soft)',
        boxShadow: '0 12px 34px rgba(8,16,30,.28)',
      }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />
      {text}
    </div>
  );
}
