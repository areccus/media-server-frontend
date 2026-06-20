// tvnav.js — Apple TV Siri Remote spatial navigation for HALO
(function () {
  const FOCUSABLE = [
    'button:not([disabled])',
    'a[href]',
    '[data-tv]',
  ].join(', ');

  let current = null;

  function candidates() {
    return Array.from(document.querySelectorAll(FOCUSABLE)).filter(el => {
      if (el.offsetParent === null) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  }

  function mid(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function setFocus(el) {
    if (current) current.classList.remove('tv-focus');
    current = el;
    if (!current) return;
    current.classList.add('tv-focus');
    current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  function ensureFocus() {
    if (!current || !document.contains(current)) {
      setFocus(candidates()[0] ?? null);
    }
  }

  function move(dir) {
    ensureFocus();
    if (!current) return;

    const from = mid(current);
    let best = null;
    let bestScore = Infinity;

    for (const el of candidates()) {
      if (el === current) continue;
      const to = mid(el);
      const dx = to.x - from.x;
      const dy = to.y - from.y;

      let fwd, perp;
      switch (dir) {
        case 'up':    if (dy >= -5)  continue; fwd = -dy; perp = Math.abs(dx); break;
        case 'down':  if (dy <= 5)   continue; fwd = dy;  perp = Math.abs(dx); break;
        case 'left':  if (dx >= -5)  continue; fwd = -dx; perp = Math.abs(dy); break;
        case 'right': if (dx <= 5)   continue; fwd = dx;  perp = Math.abs(dy); break;
        default: continue;
      }

      // Penalise large perpendicular offset; prefer nearby elements in the target direction
      const score = perp * 1.5 + fwd * 0.5;
      if (score < bestScore) { bestScore = score; best = el; }
    }

    if (best) setFocus(best);
  }

  window.__tvNav = function (dir) {
    switch (dir) {
      case 'up': case 'down': case 'left': case 'right':
        move(dir);
        break;
      case 'select':
        ensureFocus();
        current?.click();
        break;
      case 'back':
        if (window.location.hash && window.location.hash !== '#home') {
          window.navigate ? window.navigate('home') : window.history.back();
        }
        break;
      case 'playPause': {
        const v = document.querySelector('video');
        if (v) v.paused ? v.play() : v.pause();
        break;
      }
    }
  };

  // Reset focus on route change
  window.addEventListener('hashchange', () => {
    current = null;
    setTimeout(ensureFocus, 150);
  });

  // Sync focus when user clicks/taps normally
  document.addEventListener('pointerup', e => {
    const match = e.target.closest(FOCUSABLE);
    if (match) { if (current) current.classList.remove('tv-focus'); current = match; }
  }, true);
})();
