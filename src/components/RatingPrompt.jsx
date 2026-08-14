import { useState } from 'react';
import { api } from '../lib/api';
import { getDeviceId } from '../lib/deviceId';

const STARS = [1, 2, 3, 4, 5];
const IS_STATIC = import.meta.env.VITE_STATIC === '1';
const MAX_LEN = 1000;

function Star({ filled, label, onClick, onHover }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onHover}
      className="bg-transparent border-none cursor-pointer p-1 leading-none"
      style={{ color: filled ? 'var(--accent-text)' : 'var(--muted2)' }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.4 L14.6 9 L20.6 9.7 L16.2 13.9 L17.4 19.9 L12 16.9 L6.6 19.9 L7.8 13.9 L3.4 9.7 L9.4 9 Z"
          fill={filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function RatingPrompt({ ui, lang, reviewUrl, done, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  if (!reviewUrl) return null;

  if (done) {
    return (
      <div className="yg-rating" data-state="done">
        <span className="yg-rating__thanks">{ui.rateThanks}</span>
      </div>
    );
  }

  const pick = (value) => {
    setRating(value);
    if (value >= 4) {
      window.open(reviewUrl, '_blank', 'noopener');
      onDone();
      return;
    }
    setState('form');
  };

  const submit = async () => {
    const text = message.trim();
    if (!text || state === 'sending') return;
    setState('sending');
    setError('');
    try {
      if (!IS_STATIC) {
        await api.post('/menu/feedback', { id: getDeviceId(), rating, message: text, lang });
      }
      onDone();
    } catch (e) {
      if (e.message === 'limit') {
        onDone();
        return;
      }
      setError(ui.rateError);
      setState('form');
    }
  };

  return (
    <div className="yg-rating" data-state={state}>
      <span className="yg-rating__title">{ui.rateTitle}</span>

      <div className="yg-rating__stars" role="group" aria-label={ui.rateTitle} onMouseLeave={() => setHover(0)}>
        {STARS.map((n) => (
          <Star
            key={n}
            filled={n <= (hover || rating)}
            label={ui.rateStarLabel.replace('{n}', n)}
            onClick={() => pick(n)}
            onHover={() => setHover(n)}
          />
        ))}
      </div>

      {state !== 'idle' && (
        <div className="yg-rating__form">
          <label className="yg-rating__label" htmlFor="yg-rating-message">{ui.rateFormLabel}</label>
          <textarea
            id="yg-rating-message"
            rows={3}
            maxLength={MAX_LEN}
            value={message}
            placeholder={ui.ratePlaceholder}
            onChange={(e) => setMessage(e.target.value)}
            className="yg-rating__input"
          />
          {error && <span className="yg-rating__error">{error}</span>}
          <button
            type="button"
            onClick={submit}
            disabled={!message.trim() || state === 'sending'}
            className="yg-rating__send"
          >
            {state === 'sending' ? ui.rateSending : ui.rateSend}
          </button>
        </div>
      )}
    </div>
  );
}
