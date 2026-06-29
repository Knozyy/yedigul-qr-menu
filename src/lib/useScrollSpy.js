import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks which stacked section is currently under the sticky header.
 *
 * @param {string[]} ids       ordered section ids (top → bottom)
 * @param {number}   offset    sticky header height in px
 * @param {boolean}  enabled   only observe while true (e.g. not during search)
 */
export default function useScrollSpy(ids, offset, enabled) {
  const [active, setActive] = useState(ids[0] || null);
  const refs = useRef({});
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const idsKey = ids.join('|');

  useEffect(() => {
    if (!enabled) return undefined;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const line = offset + 16;
      let current = idsRef.current[0] || null;
      for (const id of idsRef.current) {
        const el = refs.current[id];
        if (!el) continue;
        if (el.getBoundingClientRect().top - line <= 0) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [idsKey, offset, enabled]);

  const register = useCallback(
    (id) => (el) => {
      if (el) refs.current[id] = el;
      else delete refs.current[id];
    },
    []
  );

  const scrollTo = useCallback((id) => {
    const el = refs.current[id];
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return { active, register, scrollTo };
}
