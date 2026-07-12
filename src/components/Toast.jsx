export default function Toast({ text }) {
  if (!text) return null;

  return (
    <div
      className="yg-anim-toast fixed left-1/2 bottom-[86px] md:bottom-[28px] z-[100] flex items-center gap-2.5 px-5 py-3 rounded-full font-inter text-[13.5px] font-medium whitespace-nowrap"
      style={{
        transform: 'translateX(-50%)',
        background: '#0F2A46',
        color: '#F2E9D6',
        boxShadow: '0 10px 30px rgba(4,12,22,.4)',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ color: 'var(--gold-lt)', flex: '0 0 auto' }} aria-hidden="true">
        <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{text}</span>
    </div>
  );
}
