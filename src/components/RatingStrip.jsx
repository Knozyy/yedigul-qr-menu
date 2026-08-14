import { useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';
import RatingPrompt from './RatingPrompt';

const DELAY_MS = 60000;
const SCROLL_RATIO = 0.4;

export default function RatingStrip({ ui, lang, reviewUrl, done, onDone, hidden }) {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!reviewUrl || done || readStorage('rating_strip_seen', false)) return undefined;

    let elapsed = false;
    let scrolled = false;
    const show = () => {
      if (!elapsed || !scrolled) return;
      writeStorage('rating_strip_seen', true);
      setVisible(true);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SCROLL_RATIO) {
        scrolled = true;
        show();
      }
    };
    const timer = setTimeout(() => {
      elapsed = true;
      show();
    }, DELAY_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reviewUrl, done]);

  if (!visible || closed || hidden) return null;

  return (
    <div className="yg-rating-strip" role="region" aria-label={ui.rateTitle}>
      <button type="button" className="yg-rating-strip__close" aria-label={ui.close} onClick={() => setClosed(true)}>
        ×
      </button>
      <RatingPrompt ui={ui} lang={lang} reviewUrl={reviewUrl} done={done} onDone={onDone} />
    </div>
  );
}
