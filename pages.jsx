// pages.jsx — Additional page components (Search, Library, Genre pages)

const { useState, useEffect, useRef } = React;

function PageSpinner({ label }) {
  return (
    <div className="page-spinner">
      <div className="page-spinner__ring">
        <svg viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
          <circle cx="22" cy="22" r="18" stroke="url(#spin-grad)" strokeWidth="3"
            strokeLinecap="round" strokeDasharray="28 85"
            style={{ transformOrigin: '22px 22px', animation: 'page-spin 0.9s linear infinite' }}/>
          <defs>
            <linearGradient id="spin-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0.2)"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      {label && <div className="page-spinner__label">{label}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Page
// ─────────────────────────────────────────────────────────────────────────────

const SEARCH_CARD_LIMIT = 4;

function SearchPage() {
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState({ movies: [], tv: [], total: 0 });
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [showSuggest, setShowSuggest]   = useState(false);
  const [suggestIdx, setSuggestIdx]     = useState(-1);
  const [moviesExpanded, setMoviesExp]  = useState(false);
  const [tvExpanded, setTvExp]          = useState(false);
  const inputRef    = useRef(null);
  const wrapperRef  = useRef(null);
  const debounceRef = useRef(null);

  // Build suggestion list from current results (interleaved, max 8)
  const suggestions = React.useMemo(() => {
    const mvs = results.movies.slice(0, 5).map(i => ({ ...i, _kind: 'Movie' }));
    const tvs = results.tv.slice(0, 5).map(i => ({ ...i, _kind: 'TV' }));
    const merged = [];
    const len = Math.max(mvs.length, tvs.length);
    for (let i = 0; i < len; i++) {
      if (mvs[i]) merged.push(mvs[i]);
      if (tvs[i]) merged.push(tvs[i]);
    }
    return merged.slice(0, 8);
  }, [results]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults({ movies: [], tv: [], total: 0 });
      setSearched(false);
      setLoading(false);
      setShowSuggest(false);
      setMoviesExp(false);
      setTvExp(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await window.fetchWithCache(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
        setShowSuggest(true);
        setSuggestIdx(-1);
        setMoviesExp(false);
        setTvExp(false);
      } catch {
        setResults({ movies: [], tv: [], total: 0 });
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function goToItem(item) {
    const [type, id] = item.id.split ? item.id.split('_') : [item._kind === 'Movie' ? 'movie' : 'tv', item.id];
    navigate(`detail/${type}/${id}`);
  }

  function onKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && suggestIdx >= 0) {
      e.preventDefault();
      goToItem(suggestions[suggestIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
    }
  }

  function SectionCards({ items, expanded, onExpand, label }) {
    const visible = expanded ? items : items.slice(0, SEARCH_CARD_LIMIT);
    const hidden = items.length - SEARCH_CARD_LIMIT;
    return (
      <div className="search-section">
        <div className="search-section-head">
          <h2 className="search-section-title">{label}</h2>
          {!expanded && hidden > 0 && (
            <button className="search-view-all" onClick={onExpand}>
              View all {items.length}
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m9 6 6 6-6 6"/>
              </svg>
            </button>
          )}
        </div>
        <div className="search-grid">
          {visible.map(item => (
            <CategoryCard key={item.id} item={item} glowMode="tone" glowIntensity={1.7} cardRadius={21} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <button className="back-button" onClick={() => navigate('home')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Back to Home
        </button>
        <h1 className="page-title">Search</h1>
      </div>

      <form className="search-form" onSubmit={e => e.preventDefault()}>
        <div className="search-input-wrapper" ref={wrapperRef}>
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Movies, shows, anime..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          {query && (
            <button type="button" className="search-clear"
              onClick={() => { setQuery(''); setShowSuggest(false); inputRef.current?.focus(); }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          {loading && (
            <div className="search-spinner">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" opacity="0.25"/>
                <path d="M12 2 A10 10 0 0 1 22 12" opacity="0.75">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
              </svg>
            </div>
          )}

          {/* Autocomplete dropdown */}
          {showSuggest && suggestions.length > 0 && (
            <div className="search-suggest">
              {suggestions.map((item, idx) => {
                const thumbSrc = item.poster
                  ? `https://image.tmdb.org/t/p/w92${item.poster}`
                  : (item.backdrop ? `https://image.tmdb.org/t/p/w300${item.backdrop}` : null);
                return (
                  <div
                    key={item.id + idx}
                    className={'search-suggest__item' + (idx === suggestIdx ? ' is-active' : '')}
                    onMouseEnter={() => setSuggestIdx(idx)}
                    onMouseDown={e => { e.preventDefault(); goToItem(item); }}
                  >
                    <div className="search-suggest__thumb">
                      {thumbSrc
                        ? <img src={thumbSrc} alt="" draggable="false" />
                        : <div className="search-suggest__thumb-ph" />}
                    </div>
                    <div className="search-suggest__info">
                      <span className="search-suggest__title">{item.title}</span>
                      {item.year && <span className="search-suggest__year">{item.year}</span>}
                    </div>
                    <span className="search-suggest__badge">{item._kind}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>

      {!loading && searched && results.total === 0 && (
        <div className="search-empty">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>No results found</div>
          <div style={{ fontSize: '14px', color: 'var(--txt-1)' }}>Try different keywords</div>
        </div>
      )}

      {results.total > 0 && (
        <div className="search-results" onClick={() => setShowSuggest(false)}>
          {results.movies.length > 0 && (
            <SectionCards
              items={results.movies}
              expanded={moviesExpanded}
              onExpand={() => setMoviesExp(true)}
              label="Movies"
            />
          )}
          {results.tv.length > 0 && (
            <SectionCards
              items={results.tv}
              expanded={tvExpanded}
              onExpand={() => setTvExp(true)}
              label="TV Shows"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Library Page (Continue Watching + Saved List)
// ─────────────────────────────────────────────────────────────────────────────

async function loadContinueWatching() {
  const pid = window.currentProfileId || 1;
  const data = await window.fetchWithCache(`/progress/continue-watching?profile_id=${pid}`) || [];
  return data.map(item => ({
    id: `${item.media_type}_${item.media_id}`,
    title: item.title,
    poster: item.poster,
    backdrop: item.backdrop,
    tone: item.tone,
    progress: item.progress,
    season: item.season || 0,
    episode: item.episode || 0,
    isMovie: item.media_type === 'movie',
  }));
}

function HistoryListItem({ item }) {
  const [hover, setHover] = useState(false);

  function handleClick() {
    const [type, id] = item.id.split('_');
    navigate(`detail/${type}/${id}`);
  }

  const epLabel = item.isMovie ? 'Movie' : (item.season > 0 ? `S${item.season} E${item.episode}` : 'TV Show');

  return (
    <div
      className={'history-item' + (hover ? ' is-hover' : '')}
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="history-item__thumb">
        <img src={item.backdrop || landscapeUrl(item)} alt="" loading="lazy" draggable="false" />
        {item.progress > 0 && (
          <div className="history-item__bar">
            <div className="history-item__bar-fill" style={{ width: `${item.progress * 100}%`, background: item.tone || 'var(--acc)' }} />
          </div>
        )}
        <div className="history-item__play">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.92)" />
            <path fill="#08090d" d="M10 8v8l6-4z"/>
          </svg>
        </div>
      </div>
      <div className="history-item__info">
        <div className="history-item__title">{item.title}</div>
        <div className="history-item__ep">{epLabel}</div>
      </div>
      <svg className="history-item__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="m9 6 6 6-6 6"/>
      </svg>
    </div>
  );
}

function LibraryPage() {
  const [continueWatching, setContinueWatching] = useState([]);
  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLibrary(); }, []);

  async function loadLibrary() {
    setLoading(true);
    try {
      const [cw, listData] = await Promise.all([
        loadContinueWatching(),
        window.fetchWithCache(`/list?profile_id=${window.currentProfileId || 1}`).catch(() => []),
      ]);
      setContinueWatching(cw || []);
      setSavedList((listData || []).map(item => ({
        id: `${item.media_type}_${item.media_id}`,
        title: item.title,
        poster: item.poster,
        backdrop: item.backdrop,
        tone: item.tone,
      })));
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  }

  function openItem(item) {
    const [type, id] = item.id.split('_');
    navigate(`detail/${type}/${id}`);
  }

  if (loading) return <PageSpinner label="Library" />;

  const recent = continueWatching.slice(0, 8);
  const hasMore = continueWatching.length > 8;

  const cwRow = { id: 'cw-lib', label: 'Continue Watching', layout: 'continue', items: recent };

  return (
    <div className="library-page">
      <div className="library-header">
        <button className="back-button" onClick={() => navigate('home')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Back to Home
        </button>
        <h1 className="page-title">My Library</h1>
      </div>

      <div className="lib-rows">
        {recent.length > 0 && (
          <Row row={cwRow} onOpen={openItem} onSeeAll={hasMore ? () => navigate('history') : null}/>
        )}
        {savedList.length > 0 && (
          <section className="lib-section">
            <div className="lib-section-head">
              <h2 className="row__title">My List</h2>
            </div>
            <div className="lib-portrait-grid">
              {savedList.map(item => {
                const [type, id] = item.id.split('_');
                return (
                  <button
                    key={item.id}
                    className="lib-portrait-card"
                    onClick={() => navigate(`detail/${type}/${id}`)}
                  >
                    <img src={window.posterUrl(item)} alt={item.title} draggable="false" loading="lazy"/>
                  </button>
                );
              })}
            </div>
          </section>
        )}
        {recent.length === 0 && savedList.length === 0 && (
          <div className="lib-empty">
            <div style={{fontSize:48, marginBottom:16}}>🎬</div>
            <div style={{fontSize:18, fontWeight:700, marginBottom:8}}>Nothing here yet</div>
            <div style={{fontSize:14, color:'var(--muted)'}}>Start watching something to see it here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContinueWatching().then(data => { setItems(data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function openItem(item) {
    const [type, id] = item.id.split('_');
    navigate(`detail/${type}/${id}`);
  }

  if (loading) return <PageSpinner label="History" />;

  const histRow = { id: 'hist-all', label: 'Watch History', layout: 'continue', items };

  return (
    <div className="library-page">
      <div className="library-header">
        <button className="back-button" onClick={() => navigate('library')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Back to Library
        </button>
        <h1 className="page-title">Watch History</h1>
      </div>

      <div className="lib-rows">
        {items.length === 0 ? (
          <div className="lib-empty">
            <div style={{fontSize:48, marginBottom:16}}>🎬</div>
            <div style={{fontSize:18, fontWeight:700, marginBottom:8}}>Nothing watched yet</div>
            <div style={{fontSize:14, color:'var(--muted)'}}>Start watching something to see it here.</div>
          </div>
        ) : (
          <Row row={histRow} onOpen={openItem}/>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Genre-organized pages (Movies, TV, Anime)
// ─────────────────────────────────────────────────────────────────────────────

function GenreRow({ genreName, items }) {
  const scrollerRef = useRef(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);

  function update() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  function nudge(dir) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: 'smooth' });
  }

  return (
    <section className="genre-section">
      <h2 className="genre-section-title">{genreName}</h2>
      <div className="row__wrap">
        <button
          className={'rownav rownav--l' + (canL ? '' : ' is-off')}
          aria-label="Scroll left"
          onClick={() => nudge(-1)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
        </button>
        <div className="genre-row__scroll" ref={scrollerRef}>
          {items.map(item => (
            <div key={item.id} className="genre-card-wrapper">
              <CategoryCard item={item} glowMode="tone" glowIntensity={1.7} cardRadius={21} />
            </div>
          ))}
        </div>
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

const GENRE_CFG = {
  movies: { label: 'Movies',   endpoint: '/movies/genres' },
  tv:     { label: 'TV Shows', endpoint: '/tv/genres'     },
  anime:  { label: 'Anime',    endpoint: '/anime/genres'  },
  kids:   { label: 'Kids',     endpoint: '/kids/genres'   },
};

// Renders a single genre row only once it scrolls near the viewport
function LazyGenreRow({ genreName, items, onOpen, mediaType }) {
  const wrapRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // Rows already near the viewport reveal instantly (before paint) — no flash
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 300) {
      setRevealed(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); obs.disconnect(); } },
      { rootMargin: '200px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const row = { id: `g-${genreName}`, label: genreName, layout: 'portrait', items };
  const seeAll = mediaType
    ? () => navigate(`genre/${mediaType}/${encodeURIComponent(genreName)}`)
    : null;

  return (
    <div ref={wrapRef} className={'lazy-genre-row' + (revealed ? ' is-revealed' : '')}>
      {revealed ? (
        <Row row={row} onOpen={onOpen} onSeeAll={seeAll}/>
      ) : (
        <div className="lazy-genre-row__skeleton">
          <div className="lazy-genre-row__sk-title"/>
          <div className="lazy-genre-row__sk-cards">
            {[0,1,2,3,4,5].map(i => <div key={i} className="lazy-genre-row__sk-card"/>)}
          </div>
        </div>
      )}
    </div>
  );
}

function GenrePage({ mediaType, initialGenre }) {
  const cfg = GENRE_CFG[mediaType] || GENRE_CFG.movies;
  const [genreData, setGenreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef({});

  useEffect(() => {
    setLoading(true);
    window.fetchWithCache(cfg.endpoint).then(data => {
      setGenreData(data || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [mediaType]);

  // Scroll to the target genre row if coming from a chip click
  useEffect(() => {
    if (!initialGenre || !genreData || loading) return;
    setTimeout(() => {
      const el = sectionRefs.current[initialGenre];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, [initialGenre, genreData, loading]);

  function openItem(item) {
    const [t, id] = (item.id || '').split('_');
    navigate(`detail/${t}/${id}`);
  }

  return (
    <div className="genre-page">
      <div className="genre-page-head">
        <button className="back-button" onClick={() => navigate('home')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Back to Home
        </button>
        <h1 className="page-title">{cfg.label}</h1>
      </div>

      {loading ? <PageSpinner label={cfg.label}/> : (
        <div className="genre-sections">
          {Object.entries(genreData || {}).map(([genreName, items]) =>
            items.length > 0 && (
              <div key={genreName} ref={el => sectionRefs.current[genreName] = el}>
                <LazyGenreRow genreName={genreName} items={items} onOpen={openItem}/>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sports Page
// ─────────────────────────────────────────────────────────────────────────────

const LEAGUE_TONE = { nba: '#E8853A', nfl: '#3A9E5A', boxing: '#E84040' };

function SportsPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  function fmtTime(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString([], {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });
    } catch (_) { return ''; }
  }

  function toItems(games, league) {
    return (games || []).map(g => ({
      ...g,
      id: g.id || `${league}-${g.away_team_abbrev}-${g.home_team_abbrev}`,
      tone: LEAGUE_TONE[league] || '#555',
      _timeLabel: fmtTime(g.start_time),
      league,
    }));
  }

  async function loadAll() {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${window.API_BASE_URL}/sports/live?league=nba`).then(r => r.json()).catch(() => ({})),
        fetch(`${window.API_BASE_URL}/sports/live?league=nfl`).then(r => r.json()).catch(() => ({})),
        fetch(`${window.API_BASE_URL}/sports/live?league=boxing`).then(r => r.json()).catch(() => ({})),
      ]);

      const nbaItems    = toItems(r1.success ? r1.data : [], 'nba');
      const nflItems    = toItems(r2.success ? r2.data : [], 'nfl');
      const boxingItems = toItems(r3.success ? r3.data : [], 'boxing');
      const liveItems   = [...nbaItems, ...nflItems, ...boxingItems].filter(g => g.status_state === 'in');

      const built = [];
      if (liveItems.length)   built.push({ id: 'live-now', label: '🔴 Live Now', layout: 'sport', items: liveItems });
      if (nbaItems.length)    built.push({ id: 'nba',      label: '🏀 NBA',       layout: 'sport', items: nbaItems });
      if (nflItems.length)    built.push({ id: 'nfl',      label: '🏈 NFL',       layout: 'sport', items: nflItems });
      if (boxingItems.length) built.push({ id: 'boxing',   label: '🥊 Boxing',    layout: 'sport', items: boxingItems });

      setRows(built);
    } catch (_) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    timerRef.current = setInterval(loadAll, 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  function openGame(game) {
    window._sportDetail = game;
    window.navigate(`sport/${game.id}`);
  }

  if (loading) return <PageSpinner label="Loading sports…"/>;

  if (!rows.length) {
    return (
      <div style={{textAlign:'center', padding:'80px 24px', color:'rgba(255,255,255,.3)'}}>
        <div style={{fontSize:64, marginBottom:16}}>🏆</div>
        <div style={{fontSize:18, fontWeight:600, marginBottom:8, color:'rgba(255,255,255,.5)'}}>No games scheduled</div>
        <div style={{fontSize:13}}>Check back on game day</div>
      </div>
    );
  }

  return (
    <React.Fragment>
      {rows.map(row => <Row key={row.id} row={row} onOpen={openGame}/>)}
    </React.Fragment>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sport Detail Page
// ─────────────────────────────────────────────────────────────────────────────

function SportDetailPage({ gameId }) {
  const game = window._sportDetail || null;
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(null);

  // If somehow we land here without game data (direct URL), show a fallback
  if (!game) {
    return (
      <div style={{textAlign:'center', padding:'120px 24px', color:'rgba(255,255,255,.4)'}}>
        <div style={{fontSize:48, marginBottom:16}}>🏆</div>
        <div style={{fontSize:18, fontWeight:600, marginBottom:12, color:'rgba(255,255,255,.6)'}}>Game not found</div>
        <button onClick={() => window.navigate('home')}
          style={{background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)',
                  color:'#fff', padding:'10px 24px', borderRadius:99, cursor:'pointer', fontFamily:'inherit', fontSize:14}}>
          ← Back
        </button>
      </div>
    );
  }

  const isLive = game.status_state === 'in';
  const tone   = game.tone || LEAGUE_TONE[(game.league || '').toLowerCase()] || '#555';

  function watchGame() {
    if (!game.stream_url) return;
    const title = `${game.away_team} vs ${game.home_team}`;
    window.location.href = `/player.html?type=sports&id=${game.id}&title=${encodeURIComponent(title)}&src=${encodeURIComponent(game.stream_url)}`;
  }

  const LeagueBadge = ({ league }) => {
    const icons = { NBA: '🏀', NFL: '🏈', BOXING: '🥊' };
    return (
      <span style={{display:'inline-flex', alignItems:'center', gap:6,
                    fontSize:12, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase',
                    color:'rgba(255,255,255,.5)'}}>
        {icons[(league||'').toUpperCase()] || '🏆'} {league}
      </span>
    );
  };

  const TeamBlock = ({ logo, name, abbrev }) => {
    const [err, setErr] = useState(false);
    return (
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:14, flex:1}}>
        {logo && !err
          ? <img src={logo} alt={abbrev} onError={() => setErr(true)}
              style={{width:clamp(80,120), height:clamp(80,120), objectFit:'contain',
                      filter:'drop-shadow(0 4px 20px rgba(0,0,0,.5))'}}/>
          : <div style={{width:100, height:100, borderRadius:16,
                          background:'rgba(255,255,255,.07)',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:44}}>
              {LEAGUE_ICONS_MAP[(game.league||'').toLowerCase()] || '🏆'}
            </div>}
        <div style={{fontSize:15, fontWeight:700, textAlign:'center', letterSpacing:'.02em',
                     color:'rgba(255,255,255,.85)', maxWidth:140, lineHeight:1.3}}>{name}</div>
        {abbrev && abbrev !== name &&
          <div style={{fontSize:11, fontWeight:600, color:'rgba(255,255,255,.35)',
                       letterSpacing:'.06em', textTransform:'uppercase'}}>{abbrev}</div>}
      </div>
    );
  };

  function clamp(min, max) { return `clamp(${min}px, 10vw, ${max}px)`; }

  return (
    <div style={{minHeight:'80vh', padding:'0 0 80px'}}>
      {/* Tone gradient background */}
      <div style={{position:'fixed', inset:0, zIndex:-1, pointerEvents:'none',
                   background:`radial-gradient(ellipse 100% 60% at 50% 0%, ${tone}28 0%, transparent 60%)`}}/>

      {/* Back button */}
      <div style={{padding:'28px var(--gutter) 0'}}>
        <button onClick={() => window.navigate('home')}
          style={{display:'inline-flex', alignItems:'center', gap:8,
                  background:'none', border:'none', color:'rgba(255,255,255,.55)',
                  fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                  padding:'6px 0', letterSpacing:'.02em'}}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Sports
        </button>
      </div>

      <div style={{maxWidth:960, margin:'0 auto', padding:'48px var(--gutter) 0'}}>
        {/* League + status */}
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:32}}>
          <LeagueBadge league={game.league}/>
          {isLive
            ? <span style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase',
                             color:'#ff4848', background:'rgba(255,50,50,.14)',
                             border:'1px solid rgba(255,50,50,.28)', borderRadius:5,
                             padding:'3px 8px', animation:'sport-pulse 2s ease-in-out infinite'}}>
                ● LIVE
              </span>
            : game._timeLabel &&
              <span style={{fontSize:13, color:'rgba(255,255,255,.4)', fontWeight:500}}>
                {game._timeLabel}
              </span>}
        </div>

        {/* Matchup */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'center',
                     gap:'clamp(24px, 6vw, 80px)', marginBottom:48}}>
          <TeamBlock logo={game.away_logo} name={game.away_team} abbrev={game.away_team_abbrev}/>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12, flexShrink:0}}>
            {isLive && game.score
              ? <div style={{fontSize:'clamp(40px, 7vw, 72px)', fontWeight:900,
                              letterSpacing:'-.04em', lineHeight:1, textShadow:'0 4px 24px rgba(0,0,0,.4)'}}>
                  {game.score}
                </div>
              : <div style={{fontSize:'clamp(28px, 5vw, 52px)', fontWeight:800,
                              color:'rgba(255,255,255,.18)'}}>VS</div>}
            {isLive &&
              <div style={{fontSize:12, color:'rgba(255,255,255,.4)', fontWeight:500}}>
                {game.status || ''}
              </div>}
          </div>
          <TeamBlock logo={game.home_logo} name={game.home_team} abbrev={game.home_team_abbrev}/>
        </div>

        {/* Play button */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:14}}>
          {game.stream_url
            ? <button onClick={watchGame}
                style={{display:'inline-flex', alignItems:'center', gap:10,
                        background:'#fff', color:'#000',
                        border:'none', borderRadius:99, cursor:'pointer',
                        fontFamily:'inherit', fontSize:16, fontWeight:700,
                        padding:'16px 40px', letterSpacing:'.02em',
                        boxShadow:`0 0 32px ${tone}55`}}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                {isLive ? 'Watch Live' : 'Watch'}
              </button>
            : <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
                {game.broadcast &&
                  <div style={{fontSize:13, color:'rgba(255,255,255,.45)', fontWeight:500,
                                display:'flex', alignItems:'center', gap:6}}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 6l11 7 11-7"/><rect x="1" y="6" width="22" height="13" rx="2"/></svg>
                    On {game.broadcast}
                  </div>}
                <a href={`https://www.espn.com/nba/game/_/gameId/${game.espn_id || game.id}`}
                   target="_blank" rel="noopener noreferrer"
                   style={{display:'inline-flex', alignItems:'center', gap:8,
                           background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.7)',
                           border:'1px solid rgba(255,255,255,.15)', borderRadius:99, cursor:'pointer',
                           fontFamily:'inherit', fontSize:14, fontWeight:600,
                           padding:'12px 28px', letterSpacing:'.02em', textDecoration:'none'}}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Watch on ESPN
                </a>
              </div>}
          {streamError &&
            <div style={{fontSize:13, color:'rgba(255,100,100,.7)'}}>{streamError}</div>}
        </div>
      </div>
    </div>
  );
}

// Export to global scope
Object.assign(window, {
  SearchPage,
  LibraryPage,
  HistoryPage,
  GenreRow,
  LazyGenreRow,
  GenrePage,
  SportsPage,
  SportDetailPage,
  GENRE_CFG,
});
