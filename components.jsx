/* components.jsx — HALO Media Server UI */
const { useState, useRef, useEffect, useMemo, useCallback } = React;

/* ── Icons ──────────────────────────────────────────────────────────────── */
const Icon = {
  play:   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  bell:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>,
  plus:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  info:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>,
  bolt:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>,
  left:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m15 5-7 7 7 7"/></svg>,
  right:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m9 5 7 7-7 7"/></svg>,
  home:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>,
  lib:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="6" height="16" rx="1"/><rect x="11" y="4" width="6" height="16" rx="1"/><path d="M20 5l1.5 14"/></svg>,
  user:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>,
};


/* ── Cursor-following sheen ──────────────────────────────────────────────── */
function useSheen() {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }, []);
  return { ref, onMouseMove: onMove };
}

/* ── Portrait poster card ────────────────────────────────────────────────── */
function PortraitCard({ item, onOpen }) {
  const s = useSheen();
  const src = posterUrl(item);
  return (
    <div className="card card--portrait" style={{'--cardglow': item.tone}}
         ref={s.ref} onMouseMove={s.onMouseMove} onClick={() => onOpen && onOpen(item)}>
      <div className="card__inner">
        <img className="art" loading="lazy" decoding="async" src={src} alt={item.title} draggable="false"
             style={src ? null : {background: item.tone}}/>
        <div className="card__sheen"></div>
        <div className="card__gloss"></div>
      </div>
      <div className="card__glow"></div>
    </div>
  );
}

/* ── Landscape card (16/10 style) ────────────────────────────────────────── */
function LandscapeCard({ item, onOpen }) {
  const s = useSheen();
  const bdSrc = backdropUrl(item) || landscapeUrl(item);
  const hasBd = !!bdSrc;
  return (
    <div className="card card--land" style={{'--cardglow': item.tone}}
         ref={s.ref} onMouseMove={s.onMouseMove} onClick={() => onOpen && onOpen(item)}>
      <div className="card__inner">
        {hasBd
          ? <img className="art" loading="lazy" decoding="async" src={bdSrc} alt={item.title} draggable="false"/>
          : <React.Fragment>
              <div className="blurfill" style={{backgroundImage: `url(${posterUrl(item)})`}}></div>
              <div className="duotone"></div>
            </React.Fragment>}
        <div className="botgrad"></div>
        <div className="card__sheen"></div>
        <div className="card__gloss"></div>
        <div className="card__label">
          <div className="t">{item.title}</div>
          <div className="s">
            <span>{item.year}</span>
            <span className="dot"></span>
            <span>{(item.genre || '').split(' · ')[0]}</span>
          </div>
        </div>
      </div>
      <div className="card__glow"></div>
    </div>
  );
}

/* ── Continue watching card ──────────────────────────────────────────────── */
function ContinueCard({ item, onOpen }) {
  const s = useSheen();
  const art = backdropUrl(item) || posterUrl(item);
  /* progress from API is 0–1 (fraction); convert to 0–100 for display */
  const pct = Math.min(100, Math.round((item.progress || 0) * 100));
  const left = item.timeLeft || '';
  const epLabel = !item.isMovie && item.season > 0 ? `S${item.season} E${item.episode}` : null;
  return (
    <div className="card card--land card--cont" style={{'--cardglow': item.tone}}
         ref={s.ref} onMouseMove={s.onMouseMove} onClick={() => onOpen && onOpen(item)}>
      <div className="card__inner">
        <img className="art" loading="lazy" decoding="async" src={art} alt={item.title} draggable="false"/>
        <div className="botgrad"></div>
        <div className="card__sheen"></div>
        <div className="card__gloss"></div>
        <div className="playover"><span>{Icon.play}</span></div>
        <div className="card__label">
          <div className="t">{item.title}</div>
          <div className="s">
            {epLabel && <React.Fragment><span>{epLabel}</span><span className="dot"></span></React.Fragment>}
            <span>{pct}% watched</span>
            {left && <React.Fragment><span className="dot"></span><span>{left}</span></React.Fragment>}
          </div>
        </div>
        <div className="prog"><i style={{width: pct + '%'}}></i></div>
      </div>
      <div className="card__glow"></div>
    </div>
  );
}

/* ── Sport card ──────────────────────────────────────────────────────────── */
const LEAGUE_ICONS_MAP = { nba: '🏀', nfl: '🏈', boxing: '🥊' };

function SportTeam({ logo, abbrev, league }) {
  const [err, setErr] = useState(false);
  return (
    <div className="sport-team">
      {logo && !err
        ? <img className="sport-logo" src={logo} alt={abbrev} onError={() => setErr(true)}/>
        : <div className="sport-logo-fb">{LEAGUE_ICONS_MAP[league] || '🏆'}</div>}
      <span className="sport-abbrev">{abbrev || 'TBD'}</span>
    </div>
  );
}

function SportCard({ item, onOpen }) {
  const s = useSheen();
  const isLive = item.status_state === 'in';
  return (
    <div className="card card--land card--sport" style={{'--cardglow': item.tone || '#444'}}
         ref={s.ref} onMouseMove={s.onMouseMove} onClick={() => onOpen && onOpen(item)}>
      <div className="card__inner">
        <div className="sport-bg"/>
        <div className="sport-teams">
          <SportTeam logo={item.away_logo} abbrev={item.away_team_abbrev || item.away_team} league={item.league}/>
          <div className="sport-mid">
            {isLive && item.score
              ? <span className="sport-score">{item.score}</span>
              : <span className="sport-vs">VS</span>}
          </div>
          <SportTeam logo={item.home_logo} abbrev={item.home_team_abbrev || item.home_team} league={item.league}/>
        </div>
        <div className="sport-foot">
          {isLive
            ? <span className="sport-live">● LIVE</span>
            : <span className="sport-time">{item._timeLabel || ''}</span>}
          <span className="sport-status-text">
            {isLive ? (item.status || '') : (item.league || '').toUpperCase()}
          </span>
        </div>
        <div className="card__sheen"/>
        <div className="card__gloss"/>
      </div>
      <div className="card__glow"/>
    </div>
  );
}

/* ── Crossfading hero background ─────────────────────────────────────────── */
function HeroBg({ src }) {
  const [layers, setLayers] = useState([{src, on: true}, {src: null, on: false}]);
  const top = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setLayers(prev => {
      const other = top.current ^ 1;
      const next = [...prev];
      next[other] = {src, on: true};
      next[top.current] = {...next[top.current], on: false};
      top.current = other;
      return next;
    });
  }, [src]);
  return (
    <div className="stage__bg">
      {layers.map((l, i) => l.src
        ? <img key={i} className={l.on ? 'is-active' : ''} src={l.src} alt="" draggable="false"/>
        : <span key={i}></span>)}
    </div>
  );
}

/* ── Hero banner ─────────────────────────────────────────────────────────── */
function Hero({ hero, heroList, heroIdx, setHeroIdx, nav, paused, setPaused }) {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    if (!hero) return;
    const [heroType, heroId] = hero.id.split('_');
    const pid = window.currentProfileId || 1;
    fetch(`${window.API_BASE_URL}/list/check/${heroType}/${heroId}?profile_id=${pid}`)
      .then(r => r.json())
      .then(d => { if (d.success) setInList(d.in_list); })
      .catch(() => {});
  }, [hero?.id]);

  if (!hero) return null;
  const [heroType, heroId] = hero.id.split('_');
  const heroSrc = hero.backdrop_large || hero.backdrop || backdropUrl(hero) || posterUrl(hero);

  function goToDetail() { window.navigate(`detail/${heroType}/${heroId}`); }

  async function toggleList(e) {
    e.stopPropagation();
    const pid = window.currentProfileId || 1;
    try {
      if (inList) {
        await fetch(`${window.API_BASE_URL}/list/remove/${heroType}/${heroId}?profile_id=${pid}`, { method: 'DELETE' });
        setInList(false);
      } else {
        await fetch(`${window.API_BASE_URL}/list/add`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: pid, media_id: heroId, media_type: heroType,
            title: hero.title, poster: hero.poster || '', backdrop: hero.backdrop || '', tone: hero.tone || '#5BB7FF' })
        });
        setInList(true);
      }
      window.clearCacheEntry?.(`/list?profile_id=${pid}`);
    } catch (_) {}
  }

  const match = hero._match || Math.min(99, Math.round((hero.vote_average || 7.5) * 10));
  const rating = hero.rating || hero.rated || 'PG-13';
  const genre = hero.genre || '';
  const rank = hero._rank || '#1 in Trending';
  const tagline = hero.tagline || hero.synopsis || hero.overview || '';
  const kindLabel = hero.kind === 'series' ? 'Series' : hero.kind === 'anime' ? 'Anime' : 'Film';

  const checkIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>;

  return (
    <div className="stage">
      <HeroBg src={heroSrc}/>
      <div className="stage__scrim"></div>

      {nav}

      <div className="hero" key={hero.id}>
        <div className="hero__kicker">
          <span><b>{genre.split(' · ')[0]}</b> · {kindLabel}</span>
        </div>
        <h1 className="hero__title">{hero.title}</h1>
        <div className="hero__meta">
          <span className="match">{match}% Match</span>
          <span>{hero.year}</span>
          {rating && <span className="pill">{rating}</span>}
          <span>{genre}</span>
        </div>
        <div className="hero__rank">{Icon.bolt}<span>{rank}</span></div>
        <p className="hero__desc">{tagline}</p>
        <div className="hero__actions">
          <button className="btn-play" onClick={goToDetail}>{Icon.play}<span>Play</span></button>
          <button className="btn-ghost" onClick={toggleList}>
            {inList ? checkIcon : Icon.plus}
            <span>{inList ? 'In List' : 'My List'}</span>
          </button>
          <button className="btn-ghost" onClick={goToDetail}>{Icon.info}<span>Info</span></button>
        </div>
        <div className="hero__dots">
          {heroList.map((_, i) => (
            <button key={i} className={i === heroIdx ? 'active' : ''}
              onClick={() => { setPaused(true); setHeroIdx(i); setTimeout(() => setPaused(false), 6000); }}
              aria-label={'Feature ' + (i + 1)}></button>
          ))}
        </div>
      </div>

      <div className="stage__glow"><b></b></div>
    </div>
  );
}

/* ── Desktop top nav ─────────────────────────────────────────────────────── */
const TABS = [
  { id: 'home',   label: 'Home' },
  { id: 'movies', label: 'Movies' },
  { id: 'series', label: 'TV Shows' },
  { id: 'anime',  label: 'Anime' },
  { id: 'kids',   label: 'Kids' },
  { id: 'sports', label: 'Sports' },
];

const TAB_GENRES = {
  movies: { type: 'movies', genres: ['Action','Sci-Fi','Horror','Comedy','Drama','Thriller','Adventure','Fantasy'] },
  series: { type: 'tv',     genres: ['Action & Adventure','Drama','Crime','Mystery','Comedy','Sci-Fi & Fantasy','Documentary','Animation'] },
  kids:   { type: 'kids',   genres: ['Family','Animation','Adventure','Comedy','Fantasy'] },
  anime:  { type: 'anime',  genres: ['Action','Fantasy','Sci-Fi','Comedy','Drama','Mystery','Horror','Romance'] },
};

const GENRE_GRADIENTS = {
  'Action':             'linear-gradient(160deg,#7b1c1c,#3a0a0a)',
  'Sci-Fi':             'linear-gradient(160deg,#0d3b7a,#050e2e)',
  'Horror':             'linear-gradient(160deg,#2e0030,#060006)',
  'Comedy':             'linear-gradient(160deg,#b34700,#5a1e00)',
  'Drama':              'linear-gradient(160deg,#005748,#001a15)',
  'Thriller':           'linear-gradient(160deg,#3a0060,#0d0018)',
  'Adventure':          'linear-gradient(160deg,#1a5c20,#031208)',
  'Fantasy':            'linear-gradient(160deg,#5c1080,#160024)',
  'Action & Adventure': 'linear-gradient(160deg,#8b1a00,#4a3000)',
  'Sci-Fi & Fantasy':   'linear-gradient(160deg,#0d3b7a,#5c1080)',
  'Mystery':            'linear-gradient(160deg,#1a2535,#060c15)',
  'Crime':              'linear-gradient(160deg,#5c0e0e,#1a0000)',
  'Documentary':        'linear-gradient(160deg,#1a4d28,#041208)',
  'Animation':          'linear-gradient(160deg,#0d4280,#1a0050)',
  'Family':             'linear-gradient(160deg,#8b4a00,#4a2000)',
  'Romance':            'linear-gradient(160deg,#7a0040,#2e0015)',
  'War & Politics':     'linear-gradient(160deg,#2e2010,#0d0800)',
};

function GenreCatCard({ genre, mediaType, backdrop, isActive, onClick }) {
  const grad = GENRE_GRADIENTS[genre] || 'linear-gradient(160deg,#1a1a2e,#060610)';
  return (
    <button
      className={'genre-cat-card' + (isActive ? ' is-active' : '')}
      style={{ background: grad }}
      onClick={onClick}
      aria-pressed={isActive}
    >
      {backdrop && (
        <img className="genre-cat-card__bg" src={backdrop} alt="" loading="lazy" draggable="false"/>
      )}
      <div className="genre-cat-card__overlay"/>
      <span className="genre-cat-card__name">{genre}</span>
    </button>
  );
}

function TopNav({ tab, setTab, sticky }) {
  return (
    <div className={'topnav' + (sticky ? ' topnav--sticky' : '')}>
      <div className="brand">HALO</div>
      <nav className="nav-tabs">
        {TABS.map(t => (
          <button key={t.id} className={t.id === tab ? 'active' : ''}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="nav-right">
        <button className="icon-btn" aria-label="search"
          onClick={() => window.navigate('search')}>{Icon.search}</button>
        <button className="icon-btn" aria-label="alerts">{Icon.bell}</button>
        <div className="avatar avatar--gen"
          onClick={() => window.showProfilePicker?.()}
          style={{cursor:'pointer'}}>
          {window.currentProfile?.avatar || '🎬'}
        </div>
      </div>
    </div>
  );
}

/* ── Mobile top header (logo + category chips) ───────────────────────────── */
function MobileTop({ tab, setTab }) {
  return (
    <React.Fragment>
      <div className="mtop">
        <div className="brand">HALO</div>
      </div>
      <div className="mchips">
        {TABS.map(t => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
    </React.Fragment>
  );
}

/* ── Mobile bottom bar ───────────────────────────────────────────────────── */
function BottomBar({ active, onNav }) {
  const items = [
    ['home',    'Home',    Icon.home],
    ['search',  'Search',  Icon.search],
    ['library', 'Library', Icon.lib],
    ['account', 'Account', Icon.user],
  ];
  return (
    <nav className="bottombar">
      {items.map(([id, label, ic]) => (
        <button key={id} className={active === id ? 'active' : ''} onClick={() => onNav(id)}>
          {ic}<span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Horizontal scrolling row ────────────────────────────────────────────── */
function Row({ row, onOpen, onSeeAll }) {
  const trackRef = useRef(null);
  const [edge, setEdge] = useState({l: true, r: false});

  const update = useCallback(() => {
    const t = trackRef.current; if (!t) return;
    setEdge({l: t.scrollLeft < 8, r: t.scrollLeft + t.clientWidth >= t.scrollWidth - 8});
  }, []);

  useEffect(() => { update(); }, [row, update]);

  function nudge(dir) {
    const t = trackRef.current; if (!t) return;
    t.scrollBy({left: dir * Math.min(t.clientWidth * 0.82, 760), behavior: 'smooth'});
  }

  const CardComp = row.layout === 'portrait' ? PortraitCard
    : row.layout === 'continue' ? ContinueCard
    : row.layout === 'sport' ? SportCard
    : LandscapeCard;

  return (
    <section className="row">
      <div className="row__head">
        <h2 className="row__title">{row.label}</h2>
        <button className="row__all" onClick={() => {
          if (onSeeAll) { onSeeAll(); return; }
          const map = {mv:'movies', tv:'tv', an:'anime', tr:'trending', rec:'recommended'};
          if (map[row.id]) window.navigate(map[row.id]);
        }}>See all</button>
      </div>
      <div className="row__scroller">
        <button className="rail-arrow left" disabled={edge.l} onClick={() => nudge(-1)} aria-label="scroll left">{Icon.left}</button>
        <div className="track" ref={trackRef} onScroll={update}>
          {(row.items || []).map((it, i) => {
            const item = typeof it === 'string' ? ITEMS[it] : it;
            if (!item) return null;
            return <CardComp key={(item.id || i)} item={item} onOpen={onOpen}/>;
          })}
        </div>
        <button className="rail-arrow right" disabled={edge.r} onClick={() => nudge(1)} aria-label="scroll right">{Icon.right}</button>
      </div>
    </section>
  );
}

/* ── Page spinner ────────────────────────────────────────────────────────── */
function PageSpinner({ label }) {
  return (
    <div className="page-spinner">
      <svg className="page-spinner__ring" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,.12)" strokeWidth="3"/>
        <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,.7)" strokeWidth="3"
          strokeLinecap="round" strokeDasharray="28 85"
          style={{animation:'page-spin 1s linear infinite', transformOrigin:'center'}}/>
      </svg>
      {label && <div className="page-spinner__label">{label}</div>}
    </div>
  );
}

/* ── Ambient background (keep for tweaks compatibility) ──────────────────── */
function AmbientBg({ variant, accentColor, intensity = 1 }) {
  if (variant === 'obsidian') {
    return (
      <div className="ambient ambient--obsidian" aria-hidden="true"
        style={{'--accent': accentColor, '--amb-intensity': intensity}}>
        <div className="amb-grid"></div>
        <div className="amb-blob amb-blob--accent"></div>
        <div className="amb-noise"></div>
      </div>
    );
  }
  return (
    <div className="ambient ambient--aurora" aria-hidden="true"
      style={{'--accent': accentColor, '--amb-intensity': intensity}}>
      <div className="amb-blob amb-blob--1"></div>
      <div className="amb-blob amb-blob--2"></div>
      <div className="amb-blob amb-blob--accent"></div>
      <div className="amb-noise"></div>
    </div>
  );
}

/* ── Breakpoint hook ─────────────────────────────────────────────────────── */
function useViewport() {
  const [vp, setVp] = useState(() => ({w: window.innerWidth, h: window.innerHeight}));
  useEffect(() => {
    const onR = () => setVp({w: window.innerWidth, h: window.innerHeight});
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return vp;
}

function useBreakpoint() {
  const { w } = useViewport();
  if (w < 560) return 'phone';
  if (w < 900) return 'tablet';
  if (w < 1400) return 'laptop';
  if (w < 2200) return 'desktop';
  return 'tv';
}

/* ── CategoryCard — alias for library/pages compatibility ────────────────── */
function CategoryCard({ item, onOpen, glowMode, glowIntensity, cardRadius }) {
  return <PortraitCard item={item} onOpen={onOpen}/>;
}

/* ── Exports ─────────────────────────────────────────────────────────────── */
Object.assign(window, {
  Icon, useSheen,
  PortraitCard, LandscapeCard, ContinueCard, CategoryCard,
  SportTeam, SportCard, LEAGUE_ICONS_MAP,
  HeroBg, Hero,
  TopNav, MobileTop, BottomBar, TABS, TAB_GENRES, GENRE_GRADIENTS, GenreCatCard,
  Row,
  PageSpinner, AmbientBg,
  useBreakpoint, useViewport,
});
