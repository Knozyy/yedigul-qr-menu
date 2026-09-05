import { useCallback, useEffect, useState } from 'react';
import { RATING_COOLDOWN_MS } from '../../shared/rating-policy.js';
import { readStorage, writeStorage } from './storage.js';

const STORAGE_KEY = 'rating_until';

function readDeadline(fallback = 0) {
  // Legacy rating_done=true has no date and must not permanently lock visitors.
  const value = readStorage(STORAGE_KEY, fallback);
  const now = Date.now();
  return typeof value === 'number' && Number.isFinite(value) && value > now && value <= now + RATING_COOLDOWN_MS
    ? value
    : 0;
}

export default function useRatingCooldown() {
  const [until, setUntil] = useState(readDeadline);

  useEffect(() => {
    if (!until) return undefined;
    const timer = setTimeout(() => setUntil(0), Math.max(0, until - Date.now()));
    return () => clearTimeout(timer);
  }, [until]);

  useEffect(() => {
    const refresh = () => setUntil(previous => readDeadline(previous));
    const onStorage = event => {
      if (event.key === 'yedigul:' + STORAGE_KEY || event.key === null) {
        setUntil(readDeadline());
      }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const markRated = useCallback((retryAfterMs = RATING_COOLDOWN_MS) => {
    const remaining = Number.isFinite(retryAfterMs)
      ? Math.max(0, Math.min(retryAfterMs, RATING_COOLDOWN_MS))
      : RATING_COOLDOWN_MS;
    const deadline = Date.now() + remaining;
    writeStorage(STORAGE_KEY, deadline);
    setUntil(deadline);
  }, []);

  return { rated: until > 0, markRated };
}
