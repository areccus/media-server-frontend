// router.jsx — Simple hash-based routing for category pages

const { useState, useEffect, useRef } = React;

// Simple hash router hook
function useRouter() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1) || 'home';
    return parseRoute(hash);
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setRoute(parseRoute(hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}

function parseRoute(hash) {
  const parts = hash.split('/');
  const page = parts[0] || 'home';

  // Parse detail pages: detail/movie/123
  if (page === 'detail' && parts.length === 3) {
    return {
      page: 'detail',
      params: {
        mediaType: parts[1],
        mediaId: parts[2]
      }
    };
  }

  // Parse sport detail: sport/{gameId}
  if (page === 'sport' && parts.length === 2) {
    return { page: 'sport', params: { gameId: parts[1] } };
  }

  // Parse genre pages: genre/movies or genre/movies/Action
  if (page === 'genre' && parts.length >= 2) {
    return {
      page: 'genre',
      params: {
        mediaType: parts[1],
        genreName: parts[2] ? decodeURIComponent(parts[2]) : null
      }
    };
  }

  return {
    page: page,
    params: parts.slice(1)
  };
}

function navigate(path) {
  window.location.hash = path;
}

// Category Page Component
function CategoryPage({ category, title, fetchEndpoint }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalPages] = useState(5); // We'll show 5 pages max (20 items per page = 100 total)

  useEffect(() => {
    loadPage(1);
  }, [category]);

  async function loadPage(pageNum) {
    setLoading(true);
    try {
      const data = await window.fetchWithCache(`${fetchEndpoint}?page=${pageNum}`);
      setItems(data || []);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load category page:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '80px var(--gutter)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📽️</div>
        <div style={{ fontSize: '18px', color: 'var(--txt-1)' }}>Loading {title}...</div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <div className="category-header">
        <button className="back-button" onClick={() => navigate('home')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Back to Home
        </button>
        <h1 className="category-title">{title}</h1>
        <div className="category-subtitle">{items.length} items • Page {page} of {totalPages}</div>
      </div>

      <div className="category-grid">
        {items.map(item => (
          <CategoryCard
            key={item.id}
            item={ITEMS[item.id] || item}
            glowMode="tone"
            glowIntensity={1.7}
            cardRadius={21}
          />
        ))}
      </div>

      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => loadPage(page - 1)}
          disabled={page === 1}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Previous
        </button>

        <div className="pagination-numbers">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={`pagination-number ${num === page ? 'is-active' : ''}`}
              onClick={() => loadPage(num)}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          className="pagination-btn"
          onClick={() => loadPage(page + 1)}
          disabled={page === totalPages}
        >
          Next
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m9 6 6 6-6 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// Lazy loading image component (same as in components.jsx)
function LazyImageCat({ src, alt = "", ...props }) {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Crect fill="%23161b26" width="300" height="450"/%3E%3C/svg%3E');

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setImageSrc(src);
            setIsLoaded(true);
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    );

    observer.observe(img);
    return () => { if (img) observer.unobserve(img); };
  }, [src, isLoaded]);

  return <img ref={imgRef} src={imageSrc} alt={alt} draggable="false" {...props} />;
}

// Larger card for category pages (portrait poster style)
function CategoryCard({ item, glowMode, glowIntensity, cardRadius }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const tone = glowMode === 'tone' ? item.tone : '#5BB7FF';

  function handleClick() {
    const [type, id] = item.id.split('_');
    navigate(`detail/${type}/${id}`);
  }

  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const ry = (px - 0.5) * 8;
    const rx = (0.5 - py) * 6;
    setTilt({ rx, ry });
  }

  function onLeave() {
    setHover(false);
    setTilt({ rx: 0, ry: 0 });
  }

  const style = {
    '--glow': tone,
    '--glow-a': hexA(tone, 0.55 * glowIntensity),
    '--glow-b': hexA(tone, 0.32 * glowIntensity),
    '--glow-c': hexA(tone, 0.18 * glowIntensity),
    '--card-radius': cardRadius + 'px',
  };

  return (
    <div
      ref={ref}
      className={'category-card' + (hover ? ' is-hover' : '')}
      tabIndex={0}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onFocus={() => setHover(true)}
      onBlur={onLeave}
      onClick={handleClick}
    >
      <div className="category-card__shelf" aria-hidden="true"></div>
      <div
        className="category-card__lift"
        style={{
          transform: hover
            ? `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-8px) scale(1.05)`
            : 'perspective(1200px) rotateX(0) rotateY(0) translateY(0) scale(1)'
        }}
      >
        <div className="category-card__art">
          <LazyImageCat src={item.poster || landscapeUrl(item)} alt={item.title} />
          <div className="card__glass-rim"></div>
          <div className="card__reflection"></div>
          <div className="card__sheen" style={{ '--mx': (tilt.ry + 5) * 4 + 'px', '--my': (-tilt.rx + 4) * 4 + 'px' }}></div>
          <div className="card__top-light"></div>
          <div className="card__inner-stroke"></div>
        </div>
      </div>

      <div className="card__neon" aria-hidden="true">
        <div className="card__neon-cast"></div>
      </div>

      <div className="category-card__info">
        <div className="category-card__title">{item.title}</div>
        <div className="category-card__meta">
          {item.year && <span>{item.year}</span>}
          {item.rating && <><span className="hero__sep"></span><span>{item.rating}</span></>}
          {item.vote_average && (
            <>
              <span className="hero__sep"></span>
              <span className="rating-badge">★ {item.vote_average.toFixed(1)}</span>
            </>
          )}
        </div>
        {item.overview && (
          <div className="category-card__overview">
            {item.overview.slice(0, 150)}{item.overview.length > 150 ? '...' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// Export to global scope
Object.assign(window, {
  useRouter,
  navigate,
  CategoryPage,
  CategoryCard
});
