export default function RatingFab({ label, visible, onClick }) {
  if (!visible) return null;

  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="yg-rating-fab">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.4 L14.6 9 L20.6 9.7 L16.2 13.9 L17.4 19.9 L12 16.9 L6.6 19.9 L7.8 13.9 L3.4 9.7 L9.4 9 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
