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
      const cw = await loadContinueWatching();
      setContinueWatching(cw);

      const pid = window.currentProfileId || 1;
      const listData = await window.fetchWithCache(`/list?profile_id=${pid}`) || [];
      setSavedList(listData.map(item => ({
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

  if (loading) {
    return (
      <PageSpinner label="Library" />
    );
  }

  const recent = continueWatching.slice(0, 8);
  const hasMore = continueWatching.length > 8;

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

      {recent.length > 0 && (
        <section className="library-section">
          <div className="library-section__head">
            <h2 className="section-title">Continue Watching</h2>
            {hasMore && (
              <button className="history-btn" onClick={() => navigate('history')}>
                History
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m9 6 6 6-6 6"/>
                </svg>
              </button>
            )}
          </div>
          <div className="history-list">
            {recent.map(item => <HistoryListItem key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {savedList.length > 0 && (
        <section className="library-section">
          <h2 className="section-title">My List</h2>
          <div className="library-grid library-grid--portrait">
            {savedList.map(item => (
              <CategoryCard key={item.id} item={item} glowMode="tone" glowIntensity={1.7} cardRadius={21} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContinueWatching().then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageSpinner label="History" />
    );
  }

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

      {items.length === 0 ? (
        <div style={{ padding: '60px var(--gutter)', textAlign: 'center', color: 'var(--txt-1)' }}>
          Nothing watched yet.
        </div>
      ) : (
        <section className="library-section">
          <div className="history-list">
            {items.map(item => <HistoryListItem key={item.id} item={item} />)}
          </div>
        </section>
      )}
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

function GenrePage({ type, title }) {
  const [genresData, setGenresData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGenres();
  }, [type]);

  async function loadGenres() {
    setLoading(true);
    try {
      let endpoint = '';
      if (type === 'movies') endpoint = '/movies/genres';
      else if (type === 'tv') endpoint = '/tv/genres';
      else if (type === 'anime') endpoint = '/anime/genres';

      const data = await window.fetchWithCache(endpoint);
      setGenresData(data);
    } catch (error) {
      console.error('Failed to load genres:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <PageSpinner label={title} />
    );
  }

  return (
    <div className="genre-page">
      <div className="genre-header">
        <button className="back-button" onClick={() => navigate('home')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Back to Home
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="genre-sections">
        {Object.entries(genresData).map(([genreName, items]) => (
          items.length > 0 && (
            <GenreRow key={genreName} genreName={genreName} items={items} />
          )
        ))}
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
  GenrePage
});
