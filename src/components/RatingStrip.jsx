import RatingPrompt from './RatingPrompt';

export default function RatingStrip({ ui, lang, reviewUrl, done, onDone, open, onClose }) {
  const shown = open && !!reviewUrl && !done;

  if (!shown) return null;

  return (
    <div className="yg-rating-strip" role="region" aria-label={ui.rateTitle}>
      <button type="button" className="yg-rating-strip__close" aria-label={ui.close} onClick={onClose}>
        ×
      </button>
      <RatingPrompt ui={ui} lang={lang} reviewUrl={reviewUrl} done={done} onDone={onDone} />
    </div>
  );
}
