// pages.jsx — Additional page components (Search, Library, Genre pages)

const { useState, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Search Page
// ─────────────────────────────────────────────────────────────────────────────

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ movies: [], tv: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    // Auto-focus search input
    inputRef.current?.focus();
  }, []);

  // Real-time search as user types
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If query is empty, reset results
    if (!query.trim()) {
      setResults({ movies: [], tv: [], total: 0 });
      setSearched(false);
      setLoading(false);
      return;
    }

    // Set loading state immediately
    setLoading(true);
    setSearched(true);

    // Debounce search - wait 400ms after user stops typing
    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await window.fetchWithCache(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
        setResults({ movies: [], tv: [], total: 0 });
      } finally {
        setLoading(false);
      }
    }, 400);

    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  async function handleSearch(e) {
    e.preventDefault();
    // Form submit is handled by the useEffect above
    // This prevents page reload on enter key
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

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Start typing to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            >
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
        <div className="search-results">
          {results.movies.length > 0 && (
            <div className="search-section">
              <h2 className="search-section-title">Movies ({results.movies.length})</h2>
              <div className="search-grid">
                {results.movies.map(item => (
                  <CategoryCard
                    key={item.id}
                    item={item}
                    glowMode="tone"
                    glowIntensity={1.7}
                    cardRadius={21}
                  />
                ))}
              </div>
            </div>
          )}

          {results.tv.length > 0 && (
            <div className="search-section">
              <h2 className="search-section-title">TV Shows ({results.tv.length})</h2>
              <div className="search-grid">
                {results.tv.map(item => (
                  <CategoryCard
                    key={item.id}
                    item={item}
                    glowMode="tone"
                    glowIntensity={1.7}
                    cardRadius={21}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Library Page (Continue Watching + Saved List)
// ─────────────────────────────────────────────────────────────────────────────

function LibraryPage() {
  const [continueWatching, setContinueWatching] = useState([]);
  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    setLoading(true);
    try {
      // Load real continue watching from database
      const pid = window.currentProfileId || 1;
      const continueResponse = await window.fetchWithCache(`/progress/continue-watching?profile_id=${pid}`);
      const continueData = continueResponse || [];

      // Format continue watching items
      const withProgress = continueData.map(item => ({
        id: `${item.media_type}_${item.media_id}`,
        title: item.title,
        poster: item.poster,
        backdrop: item.backdrop,
        tone: item.tone,
        progress: item.progress,
        meta: item.media_type === 'movie' ? 'Movie' : 'TV Show'
      }));
      setContinueWatching(withProgress);

      // Load real watchlist from database
      const listResponse = await window.fetchWithCache(`/list?profile_id=${pid}`);
      const listData = listResponse || [];

      // Format watchlist items
      const formattedList = listData.map(item => ({
        id: `${item.media_type}_${item.media_id}`,
        title: item.title,
        poster: item.poster,
        backdrop: item.backdrop,
        tone: item.tone,
        meta: item.media_type === 'movie' ? 'Movie' : 'TV Show'
      }));
      setSavedList(formattedList);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '80px var(--gutter)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <div style={{ fontSize: '18px', color: 'var(--txt-1)' }}>Loading your library...</div>
      </div>
    );
  }

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

      {continueWatching.length > 0 && (
        <section className="library-section">
          <h2 className="section-title">Continue Watching</h2>
          <div className="library-grid library-grid--landscape">
            {continueWatching.map(item => (
              <LibraryCard key={item.id} item={item} showProgress={true} />
            ))}
          </div>
        </section>
      )}

      {savedList.length > 0 && (
        <section className="library-section">
          <h2 className="section-title">My List</h2>
          <div className="library-grid library-grid--portrait">
            {savedList.map(item => (
              <CategoryCard
                key={item.id}
                item={item}
                glowMode="tone"
                glowIntensity={1.7}
                cardRadius={21}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Library card with progress bar
function LibraryCard({ item, showProgress }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(false);

  function handleClick() {
    const [type, id] = item.id.split('_');
    navigate(`detail/${type}/${id}`);
  }

  return (
    <div
      ref={ref}
      className={'library-card' + (hover ? ' is-hover' : '')}
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ '--glow': item.tone }}
    >
      <div className="library-card__poster">
        <img src={item.backdrop || landscapeUrl(item)} alt={item.title} loading="lazy" draggable="false"/>
        <div className="library-card__overlay">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.95)" />
            <path fill="#08090d" d="M10 8v8l6-4z"/>
          </svg>
        </div>
      </div>
      {showProgress && item.progress && (
        <div className="library-card__progress">
          <div className="library-card__progress-fill" style={{ width: `${item.progress * 100}%`, background: item.tone }}></div>
        </div>
      )}
      <div className="library-card__info">
        <div className="library-card__title">{item.title}</div>
        <div className="library-card__meta">
          {item.year} • {item.rating}
          {item.vote_average && ` • ★ ${item.vote_average.toFixed(1)}`}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Genre-organized pages (Movies, TV, Anime)
// ─────────────────────────────────────────────────────────────────────────────

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
      <div style={{ padding: '80px var(--gutter)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
        <div style={{ fontSize: '18px', color: 'var(--txt-1)' }}>Loading {title.toLowerCase()}...</div>
      </div>
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
            <section key={genreName} className="genre-section">
              <h2 className="genre-section-title">{genreName}</h2>
              <div className="genre-row">
                <div className="genre-row__scroll">
                  {items.map(item => (
                    <div key={item.id} className="genre-card-wrapper">
                      <CategoryCard
                        item={item}
                        glowMode="tone"
                        glowIntensity={1.7}
                        cardRadius={21}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
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
  GenrePage
});
