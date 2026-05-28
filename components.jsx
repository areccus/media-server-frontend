/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                          UI COMPONENTS                                       ║
║                    React Components for Plex UI                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📚 PURPOSE:
This file contains ALL the UI components for the media server. Think of these as
LEGO blocks that combine to create the beautiful interface you see!

Components include:
  - Sidebar: Left navigation menu (collapses on mobile)
  - Hero: Big featured banner with auto-rotating carousel
  - Card: Movie/TV show cards with glow effects
  - Row: Horizontal scrolling rows of cards
  - LazyImage: Smart image loading (loads as you scroll)
  - AmbientBg: Animated background with color-changing blobs
  - TopBar: Mobile navigation (bottom bar + category chips)

🎨 DESIGN PHILOSOPHY:
  - "Glass Morphism" - translucent cards with blurs and glows
  - "Neon Underglow" - cards glow with extracted poster colors
  - "Liquid Motion" - smooth animations and transitions
  - "3D Tilt" - cards tilt on hover (parallax effect)
  - "Responsive" - works on phone, tablet, and desktop

⚛️ REACT CONCEPTS USED:
  - Hooks: useState, useEffect, useRef, useMemo, useCallback
  - Props: Passing data between components
  - State: Managing component data that changes
  - Refs: Direct access to DOM elements
  - Events: Mouse, touch, keyboard interactions

🎯 KEY FEATURES:
  - Lazy loading: Images only load when visible (saves bandwidth)
  - Auto-cycling hero: Featured items rotate every 8.5 seconds
  - Smooth scrolling: Rows scroll smoothly with arrows
  - Responsive breakpoints: phone, tablet, laptop, desktop, TV
  - Accessibility: Keyboard navigation, ARIA labels, screen readers

📱 RESPONSIVE BREAKPOINTS:
  - phone: < 560px (bottom navigation bar)
  - tablet: 560px - 900px (simplified sidebar)
  - laptop: 900px - 1400px (full sidebar)
  - desktop: 1400px - 2200px (spacious layout)
  - tv: > 2200px (extra large layout)
*/

// ═══════════════════════════════════════════════════════════════════════════
// REACT IMPORTS - Get React hooks we need
// ═══════════════════════════════════════════════════════════════════════════

// Destructure React hooks from global React object
// (React is loaded via CDN in index.html)
const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } = React;


// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS - Reusable hooks for viewport and breakpoints
// ═══════════════════════════════════════════════════════════════════════════

/**
 * USE VIEWPORT HOOK
 *
 * What it does: Tracks window size (width and height) and updates when resized
 *
 * Why: Components need to know screen size to adapt their layout
 *
 * Returns: { w: number, h: number }
 *   - w: Window width in pixels
 *   - h: Window height in pixels
 *
 * How it works:
 *   1. Get initial window size
 *   2. Listen for resize events
 *   3. Update state when window resizes
 *   4. Clean up listener when component unmounts
 *
 * Example:
 *   const { w, h } = useViewport();
 *   if (w < 560) {
 *     // Show mobile layout
 *   }
 */
function useViewport() {
  // Initialize with current window size
  // Arrow function ensures this runs only once on mount
  const [vp, setVp] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight
  }));

  useEffect(() => {
    // Handler function that updates state on resize
    const onR = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });

    // Listen for resize events
    window.addEventListener('resize', onR);

    // Cleanup: Remove listener when component unmounts
    // This prevents memory leaks!
    return () => window.removeEventListener('resize', onR);
  }, []); // Empty array = run once on mount

  return vp;
}

/**
 * USE BREAKPOINT HOOK
 *
 * What it does: Returns current device category based on window width
 *
 * Why: Easier than checking width everywhere. Just check breakpoint name!
 *
 * Returns: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'tv'
 *
 * Breakpoints:
 *   - phone: < 560px (vertical layout, bottom nav)
 *   - tablet: 560px - 900px (simplified sidebar)
 *   - laptop: 900px - 1400px (full sidebar, standard)
 *   - desktop: 1400px - 2200px (spacious)
 *   - tv: > 2200px (extra large, 4K screens)
 *
 * Example:
 *   const bp = useBreakpoint();
 *   if (bp === 'phone') {
 *     return <MobileLayout />;
 *   }
 */
function useBreakpoint() {
  const { w } = useViewport();  // Get current width

  // Return breakpoint based on width
  if (w < 560) return 'phone';
  if (w < 900) return 'tablet';
  if (w < 1400) return 'laptop';
  if (w < 2200) return 'desktop';
  return 'tv';
}


// ═══════════════════════════════════════════════════════════════════════════
// AMBIENT BACKGROUND - Animated background with color blobs
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AMBIENT BACKGROUND COMPONENT
 *
 * What it does: Renders animated background with slow-moving color blobs
 *
 * Why: Creates depth and atmosphere. Background "breathes" with featured content
 * by changing accent color to match hero item's poster color.
 *
 * Props:
 *   - variant: 'aurora' | 'obsidian' (two different styles)
 *     - aurora: Multiple colorful blobs (default)
 *     - obsidian: Dark grid with single accent blob
 *   - accentColor: Hex color like "#7C5CFF" (from hero item tone)
 *   - intensity: 0-1 number controlling glow strength (default 1)
 *
 * How it works:
 *   - CSS animations move blobs slowly (50-80 second cycles)
 *   - CSS variables (--accent, --amb-intensity) control colors
 *   - Positioned absolute behind all content (z-index: -1)
 *   - aria-hidden="true" (decorative, not important for screen readers)
 *
 * CSS classes used:
 *   - .ambient: Container with fixed position
 *   - .amb-blob: Individual blob with radial gradient
 *   - .amb-noise: Grain texture overlay
 *   - .amb-grid: Subtle grid pattern (obsidian only)
 *
 * Example:
 *   <AmbientBg variant="aurora" accentColor="#7C5CFF" intensity={0.8} />
 */
function AmbientBg({ variant, accentColor, intensity = 1 }) {
  // Obsidian variant: Dark with grid and single accent blob
  if (variant === 'obsidian') {
    return (
      <div
        className="ambient ambient--obsidian"
        aria-hidden="true"  // Not important for accessibility
        style={{
          '--accent': accentColor,        // CSS variable for accent color
          '--amb-intensity': intensity    // CSS variable for glow strength
        }}
      >
        <div className="amb-grid"></div>        {/* Subtle grid pattern */}
        <div className="amb-vignette"></div>    {/* Dark edges */}
        <div className="amb-blob amb-blob--accent"></div>  {/* Color blob */}
      </div>
    );
  }

  // Aurora variant (default): Multiple colorful blobs
  return (
    <div
      className="ambient ambient--aurora"
      aria-hidden="true"
      style={{
        '--accent': accentColor,
        '--amb-intensity': intensity
      }}
    >
      {/* Four blobs with different colors and animations */}
      <div className="amb-blob amb-blob--a"></div>      {/* Blue blob */}
      <div className="amb-blob amb-blob--b"></div>      {/* Purple blob */}
      <div className="amb-blob amb-blob--c"></div>      {/* Orange blob */}
      <div className="amb-blob amb-blob--accent"></div> {/* Accent color blob */}
      <div className="amb-noise"></div>                 {/* Grain texture */}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION - Sidebar and mobile navigation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * NAVIGATION ITEMS
 *
 * Array of navigation items shown in sidebar and bottom bar
 *
 * Each item has:
 *   - id: Unique identifier
 *   - label: Display text
 *   - glyph: Icon name (for NavGlyph component)
 *   - route: Router path to navigate to
 */
const NAV = [
  { id:'search',   label:'Search',     glyph:'search',  route:'search' },
  { id:'home',     label:'Home',       glyph:'home',    route:'home' },
  { id:'library',  label:'Library',    glyph:'library', route:'library' },
  { id:'movies',   label:'Movies',     glyph:'film',    route:'movies' },
  { id:'tv',       label:'TV Shows',   glyph:'tv',      route:'tv' },
  { id:'anime',    label:'Anime',      glyph:'star',    route:'anime' },
  { id:'settings', label:'Settings',   glyph:'gear',    route:'home' },
];

/**
 * NAVIGATION GLYPH (ICON) COMPONENT
 *
 * What it does: Renders SVG icon for navigation items
 *
 * Why: Using SVG instead of icon font gives crisp icons at any size
 *
 * Props:
 *   - name: Icon name ('search', 'home', 'library', etc.)
 *
 * Returns: SVG element with specified icon
 *
 * All icons are:
 *   - 24×24 viewBox (consistent sizing)
 *   - Stroke-based (not filled)
 *   - currentColor (inherits text color)
 *   - 1.6px stroke width
 *   - Round caps and joins
 */
function NavGlyph({ name }) {
  // Common SVG properties for all icons
  const s = {
    width: 22,
    height: 22,
    stroke: 'currentColor',     // Inherits color from parent
    fill: 'none',               // Outline icons, not filled
    strokeWidth: 1.6,
    strokeLinecap: 'round',     // Rounded ends
    strokeLinejoin: 'round'     // Rounded corners
  };

  // Return appropriate SVG based on name
  switch (name) {
    case 'search':
      // Magnifying glass: circle + diagonal line
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <circle cx="11" cy="11" r="6"/>
          <path d="m20 20-4.3-4.3"/>
        </svg>
      );

    case 'home':
      // House: triangle roof + square base
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>
        </svg>
      );

    case 'library':
      // Three vertical bars (like books on shelf)
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <rect x="4" y="5" width="4" height="14" rx="1"/>
          <rect x="10" y="5" width="4" height="14" rx="1"/>
          <path d="m17 6 3 .8-2.5 12.6-3-.8z"/>
        </svg>
      );

    case 'film':
      // Film strip: rectangle with dividers
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <path d="M3 9h18M3 15h18M8 4v16M16 4v16"/>
        </svg>
      );

    case 'tv':
      // TV screen with stand
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <rect x="3" y="5" width="18" height="13" rx="2"/>
          <path d="m8 21 4-3 4 3"/>
        </svg>
      );

    case 'star':
      // Five-pointed star
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="m12 4 2.5 5.2 5.5.8-4 3.9.9 5.6L12 16.9 7.1 19.5 8 13.9 4 10l5.5-.8z"/>
        </svg>
      );

    case 'live':
      // Broadcast waves (concentric arcs)
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <circle cx="12" cy="12" r="2.2"/>
          <path d="M6.5 6.5a8 8 0 0 0 0 11M17.5 6.5a8 8 0 0 1 0 11M9.5 9.5a4 4 0 0 0 0 5M14.5 9.5a4 4 0 0 1 0 5"/>
        </svg>
      );

    case 'gear':
      // Settings gear icon
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
        </svg>
      );

    default:
      return null;
  }
}

/**
 * SIDEBAR COMPONENT
 *
 * What it does: Left navigation rail with collapsible feature
 *
 * Props:
 *   - active: Currently active nav item ID
 *   - setActive: Function to update active item
 *   - collapsed: Boolean, is sidebar collapsed?
 *   - toggleCollapsed: Function to toggle collapsed state
 *
 * Features:
 *   - Collapses to icon-only mode (saves space)
 *   - Shows active item with highlight
 *   - Profile section at bottom
 *   - Smooth transitions between states
 *
 * Responsive behavior:
 *   - Desktop: Always visible sidebar
 *   - Tablet/Phone: Hidden (uses TopBar/BottomNav instead)
 *
 * Keyboard accessible:
 *   - Tab navigation works
 *   - Enter/Space to click buttons
 *   - aria-current shows active page
 */
function Sidebar({ active, setActive, collapsed, toggleCollapsed }) {
  return (
    <nav
      className={'sidebar' + (collapsed ? ' is-collapsed' : '')}
      aria-label="Primary"
    >
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* BRAND/LOGO SECTION (top) */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="sidebar__brand" aria-label="Plex">
        {/* Three-bar Plex logo */}
        <div className="brand-mark">
          <span></span>  {/* Bar 1 */}
          <span></span>  {/* Bar 2 */}
          <span></span>  {/* Bar 3 */}
        </div>

        {/* "plex" wordmark (hidden when collapsed) */}
        <div className="brand-word">plex</div>

        {/* Collapse/expand toggle button */}
        <button
          className="sidebar__toggle"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {/* Chevron icon (points right when collapsed, left when expanded) */}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={collapsed ? 'm10 6 6 6-6 6' : 'm14 6-6 6 6 6'}/>
          </svg>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION ITEMS (middle) */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <ul className="sidebar__list">
        {NAV.map(n => (
          <li key={n.id}>
            <button
              className={'navbtn' + (active === n.id ? ' is-active' : '')}
              onClick={() => {
                setActive(n.id);
                // Navigate to route if specified
                if (n.route) window.navigate(n.route);
              }}
              aria-current={active === n.id ? 'page' : undefined}  // Screen reader
              title={collapsed ? n.label : undefined}  // Tooltip when collapsed
            >
              <span className="navbtn__icon">
                <NavGlyph name={n.glyph}/>
              </span>
              <span className="navbtn__label">{n.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* PROFILE SECTION (bottom) */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="sidebar__profile" title="Switch Profile" style={{ cursor: 'pointer' }}
        onClick={() => window.showProfilePicker?.()}>
        <div className="avatar" style={{ fontSize: '18px', lineHeight: 1 }}>
          {window.currentProfile?.avatar || '🎬'}
        </div>
        <div className="avatar-meta">
          <div className="avatar-name">{window.currentProfile?.name || 'Default'}</div>
          <div className="avatar-sub">Switch profile</div>
        </div>
      </div>
    </nav>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// HERO BANNER - Featured carousel at top of homepage
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HERO COMPONENT
 *
 * What it does: Large featured banner that auto-cycles through items
 *
 * Props:
 *   - heroIds: Array of item IDs to feature (e.g., ['movie_550', 'tv_1234'])
 *   - onHeroChange: Callback when hero changes (passes new tone color)
 *   - glassRadius: Border radius for glass effects
 *   - glassStrength: Blur strength for glass effects
 *
 * Features:
 *   - Auto-cycles every 8.5 seconds
 *   - Pauses on hover/focus
 *   - Smooth crossfade transitions
 *   - Color-coded accents from poster
 *   - Play, Add to List, More Info buttons
 *   - Pagination dots with progress animation
 *   - Keyboard accessible
 *
 * Visual effects:
 *   - Parallax scrolling (image moves slower than content)
 *   - Color gradient overlays
 *   - Neon accent glow at bottom
 *   - Glass shelf effect
 *   - "Plex Original" badge
 *
 * How auto-cycle works:
 *   1. useEffect sets timeout for 8.5 seconds
 *   2. When timeout fires, advance to next item
 *   3. If paused (hover/focus), don't set timeout
 *   4. Clean up timeout when effect re-runs
 *
 * States tracked:
 *   - idx: Current hero index
 *   - prev: Previous index (for fade-out animation)
 *   - paused: Is auto-cycle paused?
 *   - focused: Is hero focused (keyboard or mouse)?
 */
function Hero({ heroIds, onHeroChange, glassRadius, glassStrength }) {
  // ───────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────

  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState(null);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [heroProgress, setHeroProgress] = useState(0);

  const item = ITEMS[heroIds[idx]];

  // Fetch watch progress for the current hero item
  useEffect(() => {
    if (!item || !window.API_BASE_URL) return;
    const [type, id] = item.id.split('_');
    const pid = window.currentProfileId || 1;
    fetch(`${window.API_BASE_URL}/progress/${type}/${id}?profile_id=${pid}`)
      .then(r => r.json())
      .then(d => setHeroProgress(d.success && d.data ? d.data.progress : 0))
      .catch(() => setHeroProgress(0));
  }, [item?.id]);

  function goToDetail() {
    const [type, id] = item.id.split('_');
    window.navigate(`detail/${type}/${id}`);
  }

  // ───────────────────────────────────────────────────────────────────────
  // AUTO-CYCLE EFFECT
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Don't auto-cycle if paused
    if (paused) return;

    // Set timeout to advance after 8.5 seconds
    const t = setTimeout(() => {
      // Advance to next index, wrap around to 0 after last
      go((idx + 1) % heroIds.length);
    }, 8500);  // 8500ms = 8.5 seconds

    // Cleanup: Clear timeout when effect re-runs or component unmounts
    return () => clearTimeout(t);
  }, [idx, paused]);  // Re-run when idx or paused changes

  // ───────────────────────────────────────────────────────────────────────
  // NOTIFY PARENT OF COLOR CHANGE (for ambient background)
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Call parent's callback with new tone color
    // This lets AmbientBg update its accent color
    onHeroChange && onHeroChange(item.tone);
  }, [item.tone]);  // Run when tone changes

  // ───────────────────────────────────────────────────────────────────────
  // NAVIGATION FUNCTION
  // ───────────────────────────────────────────────────────────────────────

  function go(n) {
    // Don't do anything if already on this index
    if (n === idx) return;

    // Store current index as "previous" for fade-out animation
    setPrev(idx);

    // Update to new index
    setIdx(n);

    // Clear "previous" after animation completes (1.1 seconds)
    setTimeout(() => setPrev(null), 1100);
  }

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <section
      className={'hero' + (focused ? ' is-focus' : '')}
      tabIndex={0}
      onClick={goToDetail}
      style={{ '--hero-tone': item.tone, cursor: 'pointer' }}
      onMouseEnter={() => { setPaused(true); setFocused(true); }}
      onMouseLeave={() => { setPaused(false); setFocused(false); }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onTouchStart={() => setFocused(true)}
    >
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* IMAGE STAGE (all hero images, only one visible at a time) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="hero__stage">
        {heroIds.map((id, i) => {
          const it = ITEMS[id];

          // Determine animation state:
          //   'in' = currently visible (fade in)
          //   'out' = just left (fade out)
          //   'wait' = not visible (hidden)
          const state = i === idx ? 'in' : (i === prev ? 'out' : 'wait');

          return (
            <div key={id} className={'hero__frame hero__frame--' + state}>
              {/* Backdrop image */}
              <img
                src={backdropUrl(it)}
                alt=""
                className="hero__img"
                // First image loads eagerly, rest lazy
                loading={i === 0 ? 'eager' : 'lazy'}
              />

              {/* Gradient overlays (darken edges for text contrast) */}
              <div className="hero__scrim hero__scrim--bottom"></div>
              <div className="hero__scrim hero__scrim--left"></div>

              {/* Color tone overlay (radial gradient with poster color) */}
              <div
                className="hero__tone"
                style={{
                  background: `radial-gradient(120% 80% at 0% 100%, ${it.tone}55 0%, transparent 60%)`
                }}
              ></div>
            </div>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* CONTENT OVERLAY (title, buttons, etc.) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="hero__content">
        {/* "Featured" eyebrow with animated dot */}
        <div className="hero__eyebrow">
          <span className="dot"></span>Featured
        </div>

        {/* Title */}
        <h1 className="hero__title">{item.title}</h1>

        {/* Metadata (year, rating, runtime, genre) */}
        <div className="hero__meta">
          <span>{item.year}</span>
          <span className="hero__sep"></span>  {/* Separator dot */}
          <span>{item.rating}</span>
          <span className="hero__sep"></span>
          <span>{item.runtime}</span>
          <span className="hero__sep"></span>
          <span>{item.genre}</span>
        </div>

        {/* Synopsis (shortened overview) */}
        <p className="hero__synopsis">{item.synopsis}</p>

        {/* Action buttons */}
        <div className="hero__actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn--primary" onClick={goToDetail}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
            {heroProgress > 0.05 ? 'Resume' : 'Play'}
          </button>

          <button className="btn btn--glass">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            My List
          </button>

          <button className="btn btn--glass btn--icon" aria-label="More info" onClick={goToDetail}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 16v-5M12 8h.01"/>
            </svg>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* PAGINATION DOTS (with animated progress fill) */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <div className="hero__dots" role="tablist" aria-label="Featured selection">
          {heroIds.map((id, i) => (
            <button
              key={id}
              role="tab"
              aria-selected={i === idx}
              className={'herodot' + (i === idx ? ' is-active' : '')}
              onClick={() => go(i)}
            >
              {/* Progress fill animates from 0% to 100% over 8.5 seconds */}
              <span
                className="herodot__fill"
                style={{
                  // No animation when paused (0s duration)
                  animationDuration: paused ? '0s' : '8.5s',
                  // Only run animation on active dot when not paused
                  animationPlayState: (i === idx && !paused) ? 'running' : 'paused'
                }}
              ></span>
            </button>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* DECORATIVE ELEMENTS */}
      {/* ───────────────────────────────────────────────────────────────── */}

      {/* "Plex Original" badge (top right) */}
      <div className="hero__brandtag">
        <div className="brand-mark brand-mark--sm">
          <span></span><span></span><span></span>
        </div>
        <span>plex original</span>
      </div>

      {/* Glass shelf effect (bottom edge) */}
      <div className="hero__shelf" aria-hidden="true"></div>

      {/* Neon glow effect (bottom) */}
      <div className="hero__neon" aria-hidden="true">
        <div className="hero__neon-cast"></div>  {/* Soft glow */}
        <div className="hero__neon-bar"></div>   {/* Bright line */}
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// LAZY IMAGE - Smart image loading with Intersection Observer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LAZY IMAGE COMPONENT
 *
 * What it does: Only loads images when they're about to enter viewport
 *
 * Why: HUGE performance boost! Instead of loading 50+ images at once,
 * only load what's visible. This saves:
 *   - Bandwidth (less data downloaded)
 *   - Memory (fewer images in RAM)
 *   - Initial load time (page loads much faster)
 *
 * How it works:
 *   1. Initially show placeholder (solid color SVG, tiny size)
 *   2. Use IntersectionObserver to watch when image enters viewport
 *   3. When image is 200px away from viewport, start loading real image
 *   4. Replace placeholder with real image
 *
 * Props:
 *   - src: Real image URL to load
 *   - alt: Alt text for accessibility
 *   - ...props: Any other img props (className, etc.)
 *
 * IntersectionObserver API:
 *   - Browser API for detecting when element enters/leaves viewport
 *   - More efficient than scroll listeners
 *   - rootMargin: '200px' = start loading 200px before visible
 *   - threshold: 0.01 = trigger when 1% visible
 *
 * Example:
 *   <LazyImage src="https://image.tmdb.org/t/p/w500/abc.jpg" alt="Movie poster" />
 */
function LazyImage({ src, alt = "", ...props }) {
  // ───────────────────────────────────────────────────────────────────────
  // STATE AND REFS
  // ───────────────────────────────────────────────────────────────────────

  const imgRef = useRef(null);  // Reference to img DOM element
  const [isLoaded, setIsLoaded] = useState(false);  // Has real image loaded?

  // Placeholder SVG (solid dark blue rectangle, very small size)
  // data:image/svg+xml = inline SVG as data URL (no network request!)
  const [imageSrc, setImageSrc] = useState(
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"%3E%3Crect fill="%23161b26" width="800" height="450"/%3E%3C/svg%3E'
  );

  // ───────────────────────────────────────────────────────────────────────
  // INTERSECTION OBSERVER EFFECT
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;  // No ref yet, skip

    // Create IntersectionObserver instance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // entry.isIntersecting = is element visible in viewport?
          if (entry.isIntersecting && !isLoaded) {
            // Image entered viewport! Load real image
            setImageSrc(src);
            setIsLoaded(true);
          }
        });
      },
      {
        rootMargin: '200px',  // Start loading 200px before entering viewport
                              // This gives time for image to load before visible
        threshold: 0.01       // Trigger when 1% of image is visible
      }
    );

    // Start observing this image element
    observer.observe(img);

    // Cleanup: Stop observing when component unmounts
    return () => {
      if (img) observer.unobserve(img);
    };
  }, [src, isLoaded]);  // Re-run if src changes or image loads

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <img
      ref={imgRef}
      src={imageSrc}  // Starts as placeholder, becomes real image when loaded
      alt={alt}
      draggable="false"  // Disable drag (cleaner UX)
      {...props}  // Spread any additional props (className, style, etc.)
    />
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// CARD - Movie/TV show card with glow and 3D tilt effects
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CARD COMPONENT
 *
 * What it does: Renders beautiful 3D-tilt card with neon underglow
 *
 * Props:
 *   - item: Media item object (movie/TV show)
 *   - kind: 'poster' | 'continue' (show progress bar for continue watching)
 *   - glowMode: 'tone' | 'fixed' (use poster color or fixed color)
 *   - glowIntensity: 0-1 number for glow strength
 *   - cardRadius: Border radius in pixels
 *
 * Visual effects:
 *   - 3D tilt on hover (parallax)
 *   - Neon underglow (color-matched to poster)
 *   - Glass rim reflection
 *   - Moving sheen/highlight
 *   - Lift and scale on hover
 *   - Progress bar (for continue watching)
 *
 * 3D Tilt math:
 *   - Track mouse position relative to card center
 *   - Convert to rotation angles (rotateX, rotateY)
 *   - Apply perspective transform
 *   - Result: Card appears to rotate towards cursor
 *
 * Keyboard accessible:
 *   - tabIndex={0} makes card focusable
 *   - onClick navigates to detail page
 *   - onFocus/onBlur show hover effects
 *
 * Example:
 *   <Card item={ITEMS['movie_550']} kind="poster" glowMode="tone" glowIntensity={0.8} cardRadius={12} />
 */
function Card({ item, kind = 'poster', glowMode, glowIntensity, cardRadius }) {
  // ───────────────────────────────────────────────────────────────────────
  // STATE AND REFS
  // ───────────────────────────────────────────────────────────────────────

  const ref = useRef(null);  // Reference to card DOM element
  const [hover, setHover] = useState(false);  // Is card hovered?

  // Tilt angles and translation offsets
  const [tilt, setTilt] = useState({
    rx: 0,  // rotateX (vertical tilt)
    ry: 0,  // rotateY (horizontal tilt)
    tx: 0,  // translateX (horizontal offset)
    ty: 0   // translateY (vertical offset)
  });

  // Glow color: use poster tone or fixed blue
  const tone = glowMode === 'tone' ? item.tone : '#5BB7FF';

  // ───────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ───────────────────────────────────────────────────────────────────────

  /**
   * HANDLE CLICK - Navigate to detail page
   */
  function handleClick() {
    // Parse item ID: "movie_550" → type="movie", id="550"
    const [type, id] = item.id.split('_');

    if (type && id) {
      // Navigate to detail page: /detail/movie/550
      window.navigate(`detail/${type}/${id}`);
    }
  }

  /**
   * HANDLE MOUSE MOVE - Update 3D tilt based on cursor position
   */
  function onMove(e) {
    const el = ref.current;
    if (!el) return;

    // Get card's position and size
    const r = el.getBoundingClientRect();

    // Calculate mouse position relative to card center (0..1)
    // px = 0 (left edge), 0.5 (center), 1 (right edge)
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    // Convert to rotation angles (degrees)
    // Center (0.5, 0.5) = no rotation
    // Edges = maximum rotation
    const ry = (px - 0.5) * 10;  // Horizontal tilt (-5° to +5°)
    const rx = (0.5 - py) * 8;   // Vertical tilt (-4° to +4°)

    // Translation offsets for sheen effect
    const tx = (px - 0.5) * 6;   // Horizontal offset
    const ty = (py - 0.5) * 4;   // Vertical offset

    // Update tilt state
    setTilt({ rx, ry, tx, ty });
  }

  /**
   * HANDLE MOUSE LEAVE - Reset tilt to neutral
   */
  function onLeave() {
    setHover(false);
    setTilt({ rx: 0, ry: 0, tx: 0, ty: 0 });
  }

  // ───────────────────────────────────────────────────────────────────────
  // STYLING
  // ───────────────────────────────────────────────────────────────────────

  // Get landscape image URL (16:9 aspect ratio)
  const url = landscapeUrl(item);

  // CSS variables and inline styles
  const style = {
    '--glow': tone,  // Base glow color
    // Multiple glow layers with different opacities
    '--glow-a': hexA(tone, 0.55 * glowIntensity),  // Brightest
    '--glow-b': hexA(tone, 0.32 * glowIntensity),  // Medium
    '--glow-c': hexA(tone, 0.18 * glowIntensity),  // Faintest
    '--card-radius': cardRadius + 'px',  // Border radius
    aspectRatio: '16/9',  // Maintain 16:9 ratio (CSS property)
  };

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={ref}
      className={'card card--' + kind + (hover ? ' is-hover' : '')}
      tabIndex={0}  // Make keyboard focusable
      style={style}
      // Mouse events
      onMouseEnter={() => setHover(true)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      // Keyboard events
      onFocus={() => setHover(true)}
      onBlur={onLeave}
      // Click to navigate
      onClick={handleClick}
    >
      {/* Glass shelf effect (bottom edge) */}
      <div className="card__shelf" aria-hidden="true"></div>

      {/* Lifting container with 3D transforms */}
      <div
        className="card__lift"
        style={{
          transform: hover
            // Hover: Tilt + lift + scale
            ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-7px) scale(1.06)`
            // No hover: Neutral position
            : 'perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)'
        }}
      >
        {/* Card image and effects */}
        <div className="card__art">
          {/* Lazy-loaded image */}
          <LazyImage src={url} alt={item.title} />

          {/* Glass rim highlight */}
          <div className="card__glass-rim"></div>

          {/* Subtle reflection */}
          <div className="card__reflection"></div>

          {/* Moving sheen (follows cursor) */}
          <div
            className="card__sheen"
            style={{
              // Offset sheen based on tilt for parallax effect
              '--mx': (tilt.ry + 5) * 4 + 'px',
              '--my': (-tilt.rx + 4) * 4 + 'px'
            }}
          ></div>

          {/* Top light accent */}
          <div className="card__top-light"></div>

          {/* Inner stroke (border) */}
          <div className="card__inner-stroke"></div>
        </div>

        {/* Progress bar (only for continue watching cards) */}
        {kind === 'continue' && (
          <div className="card__progress">
            <div
              className="card__progress-fill"
              style={{ width: (item.progress * 100) + '%' }}
            ></div>
          </div>
        )}
      </div>

      {/* Neon underglow effect */}
      <div className="card__neon" aria-hidden="true">
        <div className="card__neon-cast"></div>  {/* Soft glow halo */}
      </div>

      {/* Caption (shown on hover) */}
      <div className="card__caption" aria-hidden={!hover}>
        <div className="card__title">{item.title}</div>
        {item.sub && <div className="card__sub">{item.sub}</div>}
        {!item.sub && item.meta && <div className="card__sub">{item.meta}</div>}
      </div>
    </div>
  );
}

/**
 * HEX TO RGBA CONVERTER
 *
 * What it does: Converts hex color to rgba with custom alpha
 *
 * Why: CSS rgba() lets us control transparency, hex doesn't
 *
 * Supports both formats:
 *   - #RRGGBB (6 digits) → "#FF5733"
 *   - #RGB (3 digits) → "#F73"
 *
 * Parameters:
 *   - hex: Hex color string like "#FF5733" or "#F73"
 *   - a: Alpha (0-1), where 0=transparent, 1=opaque
 *
 * Returns: rgba string like "rgba(255,87,51,0.5)"
 *
 * Example:
 *   hexA('#FF5733', 0.5) → "rgba(255,87,51,0.5)"
 *   hexA('#F73', 0.8) → "rgba(255,119,51,0.8)"
 */
function hexA(hex, a) {
  // Remove '#' if present
  let h = hex.replace('#', '');

  // Expand 3-digit hex to 6-digit (#RGB → #RRGGBB)
  // "F73" → "FF7733"
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }

  // Parse hex pairs to decimal
  const r = parseInt(h.slice(0, 2), 16);  // Red (0-255)
  const g = parseInt(h.slice(2, 4), 16);  // Green (0-255)
  const b = parseInt(h.slice(4, 6), 16);  // Blue (0-255)

  // Return rgba string
  return `rgba(${r},${g},${b},${a})`;
}


// ═══════════════════════════════════════════════════════════════════════════
// ROW - Horizontal scrolling row of cards
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ROW COMPONENT
 *
 * What it does: Horizontal scrolling row with navigation arrows
 *
 * Props:
 *   - row: Row object with { id, label, items, kind? }
 *   - glowMode: Glow mode to pass to cards
 *   - glowIntensity: Glow intensity to pass to cards
 *   - cardRadius: Border radius to pass to cards
 *
 * Features:
 *   - Smooth horizontal scrolling
 *   - Left/right arrow navigation
 *   - Arrows hide when can't scroll further
 *   - "See all" button (routes to full page)
 *   - Responsive card sizing
 *
 * Arrow visibility logic:
 *   - Left arrow: Visible if scrolled > 4px from start
 *   - Right arrow: Visible if not at end
 *   - Updated on scroll and resize
 *
 * Scroll behavior:
 *   - Nudge scrolls 85% of visible width
 *   - Smooth CSS scroll (behavior: 'smooth')
 *   - Handles mouse wheel and touch scrolling too
 *
 * Example:
 *   <Row
 *     row={{ id: 'tr', label: 'Trending Now', items: ['movie_1', 'movie_2'] }}
 *     glowMode="tone"
 *     glowIntensity={0.8}
 *     cardRadius={12}
 *   />
 */
function Row({ row, glowMode, glowIntensity, cardRadius }) {
  // ───────────────────────────────────────────────────────────────────────
  // STATE AND REFS
  // ───────────────────────────────────────────────────────────────────────

  const scrollerRef = useRef(null);  // Reference to scrollable container
  const [canL, setCanL] = useState(false);  // Can scroll left?
  const [canR, setCanR] = useState(true);   // Can scroll right?

  // Is this a "continue watching" row?
  const isCont = row.kind === 'continue';

  // ───────────────────────────────────────────────────────────────────────
  // ARROW VISIBILITY UPDATE
  // ───────────────────────────────────────────────────────────────────────

  /**
   * UPDATE ARROW VISIBILITY
   *
   * Checks scroll position and updates arrow visibility
   */
  function update() {
    const el = scrollerRef.current;
    if (!el) return;

    // Can scroll left? (more than 4px from start)
    setCanL(el.scrollLeft > 4);

    // Can scroll right? (not at end)
    // el.scrollLeft = current scroll position
    // el.clientWidth = visible width
    // el.scrollWidth = total scrollable width
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  // Run update on mount, scroll, and resize
  useEffect(() => {
    update();  // Initial check

    const el = scrollerRef.current;
    if (!el) return;

    // Listen for scroll events (passive for better performance)
    el.addEventListener('scroll', update, { passive: true });

    // Listen for window resize
    window.addEventListener('resize', update);

    // Cleanup listeners
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // SCROLL NAVIGATION
  // ───────────────────────────────────────────────────────────────────────

  /**
   * NUDGE - Scroll left or right by ~85% of visible width
   *
   * Parameters:
   *   - dir: Direction (-1 for left, 1 for right)
   */
  function nudge(dir) {
    const el = scrollerRef.current;
    if (!el) return;

    // Scroll by 85% of visible width
    // Math.round for whole pixels (smoother animation)
    // behavior: 'smooth' for animated scrolling
    el.scrollBy({
      left: dir * Math.round(el.clientWidth * 0.85),
      behavior: 'smooth'
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // ROUTE MAPPING
  // ───────────────────────────────────────────────────────────────────────

  // Map row IDs to routes for "See all" button
  const routeMap = {
    'tr': 'trending',
    'rec': 'recommended',
    'mv': 'movies',
    'tv': 'tv-shows',
    'an': 'anime'
  };

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <section className={'row row--' + (isCont ? 'continue' : 'poster')}>
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* HEADER (title + "See all" button) */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <header className="row__head">
        <h2 className="row__title">{row.label}</h2>

        {/* "See all" button (if route exists for this row) */}
        {routeMap[row.id] && (
          <button
            className="row__see"
            onClick={() => window.navigate(routeMap[row.id])}
          >
            See all
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="m9 6 6 6-6 6"/>
            </svg>
          </button>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* SCROLLABLE CONTENT with arrow buttons */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="row__wrap">
        {/* Left arrow button */}
        <button
          className={'rownav rownav--l' + (canL ? '' : ' is-off')}
          aria-label="Scroll left"
          onClick={() => nudge(-1)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
        </button>

        {/* Scrollable container */}
        <div className="row__scroll" ref={scrollerRef}>
          <div className="row__inner">
            {/* Render cards for each item */}
            {row.items.map(id => (
              <Card
                key={id}
                item={ITEMS[id]}
                kind={isCont ? 'continue' : 'poster'}
                glowMode={glowMode}
                glowIntensity={glowIntensity}
                cardRadius={cardRadius}
              />
            ))}
          </div>
        </div>

        {/* Right arrow button */}
        <button
          className={'rownav rownav--r' + (canR ? '' : ' is-off')}
          aria-label="Scroll right"
          onClick={() => nudge(1)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m9 6 6 6-6 6"/>
          </svg>
        </button>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// TOP BAR (MOBILE/TABLET NAVIGATION)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * TOP BAR COMPONENT
 *
 * What it does: Mobile-friendly navigation with top chips and bottom bar
 *
 * Props:
 *   - active: Currently active nav item ID
 *   - setActive: Function to update active item
 *
 * Layout:
 *   - Top: Logo + horizontal scrolling category chips
 *   - Bottom: iOS-style tab bar with icons
 *
 * Used on:
 *   - Phone breakpoint (< 560px)
 *   - Tablet breakpoint (560px - 900px)
 *
 * Features:
 *   - Touch-optimized buttons (larger hit areas)
 *   - Horizontal scroll for categories
 *   - Active state highlighting
 *   - Bottom bar stays fixed at bottom
 *
 * Why bottom navigation?
 *   - Easier to reach with thumb on phones
 *   - iOS/Android convention (users expect it)
 *   - Doesn't block content at top
 *
 * Example:
 *   <TopBar active="home" setActive={setActive} />
 */
function TopBar({ active, setActive }) {
  // ───────────────────────────────────────────────────────────────────────
  // STATE
  // ───────────────────────────────────────────────────────────────────────

  const [showCategories, setShowCategories] = useState(false);

  // Category navigation items (subset of NAV for top chips)
  const categories = ['home', 'movies', 'tv', 'anime'];

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER (logo + category chips) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <header className="mobile-header">
        {/* Logo */}
        <div className="mobile-header__brand">
          <div className="brand-mark">
            <span></span><span></span><span></span>
          </div>
          <div className="brand-word">plex</div>
        </div>

        {/* Horizontal scrolling category chips */}
        <div className="category-chips">
          {categories.map(cat => {
            // Find nav item for this category
            const navItem = NAV.find(n => n.id === cat);

            return (
              <button
                key={cat}
                className={'chip' + (active === cat ? ' chip--active' : '')}
                onClick={() => {
                  setActive(cat);
                  // Navigate if route exists
                  if (navItem?.route) window.navigate(navItem.route);
                }}
              >
                {navItem?.label || cat}
              </button>
            );
          })}
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* BOTTOM NAVIGATION BAR (iOS-style) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <nav className="bottom-nav" aria-label="Primary">
        {/* Home button */}
        <button
          className={'bottom-nav__item' + (active === 'home' ? ' is-active' : '')}
          onClick={() => {
            setActive('home');
            window.navigate('home');
          }}
        >
          <NavGlyph name="home"/>
          <span>Home</span>
        </button>

        {/* Search button */}
        <button
          className={'bottom-nav__item' + (active === 'search' ? ' is-active' : '')}
          onClick={() => {
            setActive('search');
            window.navigate('search');
          }}
        >
          <NavGlyph name="search"/>
          <span>Search</span>
        </button>

        {/* Library button */}
        <button
          className={'bottom-nav__item' + (active === 'library' ? ' is-active' : '')}
          onClick={() => {
            setActive('library');
            window.navigate('library');
          }}
        >
          <NavGlyph name="library"/>
          <span>Library</span>
        </button>

        {/* Account button (with avatar) */}
        <button
          className={'bottom-nav__item' + (active === 'settings' ? ' is-active' : '')}
          onClick={() => {
            setActive('settings');
            window.showProfilePicker?.();
          }}
        >
          <div className="avatar avatar--xs" style={{ fontSize: '14px' }}>
            {window.currentProfile?.avatar || '🎬'}
          </div>
          <span>Account</span>
        </button>
      </nav>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MAKE COMPONENTS AVAILABLE GLOBALLY
 *
 * Attaches all components to window object so they can be used anywhere
 *
 * Why global instead of ES modules?
 *   - This app uses CDN-loaded React (no build step)
 *   - Simple approach for small projects
 *   - Works great when you need fast prototyping
 *
 * Alternative: Could use proper ES modules with bundler (Vite, webpack, etc.)
 *
 * After this runs, you can use:
 *   window.AmbientBg
 *   window.Sidebar
 *   window.Hero
 *   window.Card
 *   window.Row
 *   etc.
 */
Object.assign(window, {
  AmbientBg,        // Animated background component
  Sidebar,          // Left navigation sidebar
  TopBar,           // Mobile top bar and bottom navigation
  Hero,             // Featured banner carousel
  Row,              // Horizontal scrolling row
  Card,             // Media item card
  useBreakpoint,    // Hook for responsive breakpoints
  useViewport,      // Hook for window size
  hexA,             // Hex to RGBA converter utility
});


// ═══════════════════════════════════════════════════════════════════════════
// NOTES FOR FUTURE DEVELOPMENT
// ═══════════════════════════════════════════════════════════════════════════

/*
COMPONENT ARCHITECTURE NOTES:

1. STATE MANAGEMENT:
   Currently using:
     - Local component state (useState)
     - Global window object for shared data (ITEMS, HERO_LIST, ROWS)

   Could upgrade to:
     - React Context API (better than global but simpler than Redux)
     - Redux or Zustand (for complex state management)
     - React Query (for server state caching)

2. PERFORMANCE OPTIMIZATIONS:
   Already implemented:
     - LazyImage with IntersectionObserver (huge win!)
     - useMemo/useCallback where needed
     - CSS animations (GPU-accelerated)

   Could add:
     - React.memo() for expensive components
     - Virtual scrolling for very long rows
     - Code splitting with React.lazy()
     - Service Worker for offline support

3. ACCESSIBILITY:
   Already implemented:
     - ARIA labels and roles
     - Keyboard navigation (tabIndex)
     - Focus states
     - aria-hidden for decorative elements

   Could improve:
     - Skip links for navigation
     - Reduced motion support
     - High contrast mode
     - Screen reader testing

4. RESPONSIVE DESIGN:
   Already implemented:
     - useBreakpoint hook
     - Different layouts for phone/tablet/desktop
     - Touch-optimized mobile navigation

   Could add:
     - Landscape vs portrait detection
     - Responsive images (srcset)
     - Adaptive loading (load less on slow connections)

5. ANIMATIONS:
   Currently using:
     - CSS transitions (smooth and performant)
     - CSS animations (for continuous motion)
     - Transform-based animations (GPU-accelerated)

   Could add:
     - Framer Motion library (advanced animations)
     - React Spring (physics-based animations)
     - GSAP (timeline animations)

6. TESTING:
   Currently: None (manual testing only)

   Should add:
     - Jest + React Testing Library (unit tests)
     - Cypress or Playwright (E2E tests)
     - Storybook (component documentation)
     - Accessibility testing (axe-core)
*/
