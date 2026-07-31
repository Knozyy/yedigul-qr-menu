// Ana siteye (/) dönüş linki. QR menünün hem en üstünde hem footer'ında
// aynı görünümle kullanılır; renkler menü token'larından gelir (tema uyumlu).
export default function HomeLink({ label = 'Ana Sayfa', rtl = false, inverse = false }) {
  return (
    <a
      href="/"
      className={`yg-home-link inline-flex items-center gap-2 min-h-11 px-4 rounded-full text-[13.5px] font-medium cursor-pointer transition-colors duration-200${inverse ? ' yg-home-link--inverse' : ''}`}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        className="flex-none"
        aria-hidden="true"
        style={{ transform: rtl ? 'scaleX(-1)' : 'none' }}
      >
        <path
          d="M3 11.2 L12 3.5 L21 11.2 M5.2 9.4 V20 H18.8 V9.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </a>
  );
}
