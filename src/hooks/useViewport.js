import { useState, useEffect } from 'react';

export function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight
  }));

  useEffect(() => {
    const onResize = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return vp;
}

export function useBreakpoint() {
  const { w } = useViewport();

  if (w < 560) return 'phone';
  if (w < 900) return 'tablet';
  if (w < 1400) return 'laptop';
  if (w < 2200) return 'desktop';
  return 'tv';
}
