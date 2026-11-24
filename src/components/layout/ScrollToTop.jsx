import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash, state } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (state?.scrollToCatalog) return undefined;
    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ''));
      let attempts = 0;
      let frame = 0;
      const go = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: 'start' });
          return;
        }
        attempts += 1;
        if (attempts < 20) frame = window.requestAnimationFrame(go);
      };
      go();
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash, state]);

  return null;
};

export default ScrollToTop;
