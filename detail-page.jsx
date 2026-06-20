// detail-page.jsx — Movie/TV Show detail page

const { useState, useEffect, useRef } = React;

// iOS blocks cross-origin iframe autoplay at the WebKit level — detect once
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function DetailPage({ mediaType, mediaId }) {
  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressData, setProgressData] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [inList, setInList] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  // Desktop: showTrailer swaps the banner to the autoplaying iframe
  // iOS: showTrailerBtn reveals the Watch Trailer button → trailerOpen opens modal
  const [showTrailer, setShowTrailer] = useState(false);
  const [showTrailerBtn, setShowTrailerBtn] = useState(false);
  const trailerTimerRef = useRef(null);

  // Reset everything when navigating to a different item
  useEffect(() => {
    setSelectedSeason(1);
    setEpisodes([]);
    setSeasonDropdownOpen(false);
    setTrailerKey(null);
    setShowTrailer(false);
    setShowTrailerBtn(false);
    clearTimeout(trailerTimerRef.current);
  }, [mediaId]);

  useEffect(() => {
    loadDetails();
    loadProgress();
    checkInList();
  }, [mediaType, mediaId]);

  // Fetch trailer, then after 5 s: autoplay in banner (desktop) or show button (iOS)
  useEffect(() => {
    if (!mediaId) return;
    setTrailerKey(null);
    setShowTrailer(false);
    setShowTrailerBtn(false);
    clearTimeout(trailerTimerRef.current);
    fetch(`${window.API_BASE_URL}/trailer/${mediaType}/${mediaId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.key) {
          setTrailerKey(d.key);
          trailerTimerRef.current = setTimeout(() => {
            if (IS_IOS) {
              setShowTrailerBtn(true);
            } else {
              setShowTrailer(true);
            }
          }, 5000);
        }
      })
      .catch(() => {});
    return () => clearTimeout(trailerTimerRef.current);
  }, [mediaType, mediaId]);

  // Load episodes when item is ready or season changes
  useEffect(() => {
    if (item && (mediaType === 'tv' || mediaType === 'anime') && item.seasons && item.seasons.length > 0) {
      loadEpisodes(item.tmdb_id, selectedSeason);
    }
  }, [item, selectedSeason]);

  async function loadDetails() {
    setLoading(true);
    try {
      // Always fetch full details from API to get IMDB ID and VidSrc URL
      const data = await window.fetchWithCache(`/details/${mediaType}/${mediaId}`);
      setItem(data);
      loadSimilar(mediaType);
    } catch (error) {
      console.error('Failed to load details:', error);
      // Fallback to cached item if API fails
      const cachedItem = ITEMS[`${mediaType}_${mediaId}`];
      if (cachedItem) {
        setItem(cachedItem);
        loadSimilar(mediaType);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadEpisodes(tmdbId, seasonNum) {
    setEpisodesLoading(true);
    try {
      const response = await fetch(`${window.API_BASE_URL}/tv/${tmdbId}/season/${seasonNum}`);
      const result = await response.json();
      if (result.success) setEpisodes(result.data);
    } catch (error) {
      console.error('Failed to load episodes:', error);
    } finally {
      setEpisodesLoading(false);
    }
  }

  function playEpisode(seasonNum, episodeNum, startOver = false) {
    const currentSeason = item.seasons?.find(s => s.season_number === seasonNum);
    const totalEpisodes = currentSeason?.episode_count || 0;
    const mediaRef = item.imdb_id || item.tmdb_id;
    const idKey = item.imdb_id ? 'imdb' : 'tmdb';
    const src = `https://vidsrc-embed.ru/embed/tv?${idKey}=${mediaRef}&season=${seasonNum}&episode=${episodeNum}`;
    const epTitle = encodeURIComponent(`${item.title} S${seasonNum}E${episodeNum}`);
    const idParam = item.imdb_id ? `imdbId=${item.imdb_id}` : `tmdbId=${item.tmdb_id}`;
    const posterP   = encodeURIComponent(item.poster   || '');
    const backdropP = encodeURIComponent(item.backdrop || '');
    const toneP     = encodeURIComponent(item.tone     || '#5BB7FF');
    const soParam   = startOver ? '&startOver=1' : '';
    window.location.href = `/player.html?type=${mediaType}&id=${mediaId}&title=${epTitle}&src=${encodeURIComponent(src)}&season=${seasonNum}&episode=${episodeNum}&totalEpisodes=${totalEpisodes}&${idParam}&poster=${posterP}&backdrop=${backdropP}&tone=${toneP}${soParam}`;
  }

  async function loadSimilar(type) {
    try{
      let endpoint = '/movies';
      if (type === 'tv') endpoint = '/tv';
      else if (type === 'anime') endpoint = '/anime';

      const data = await window.fetchWithCache(endpoint);
      setSimilar(data.slice(0, 8)); // Get 8 similar items
    } catch (error) {
      console.error('Failed to load similar:', error);
    }
  }

  async function loadProgress() {
    try {
      const pid = window.currentProfileId || 1;
      const response = await fetch(`${window.API_BASE_URL}/progress/${mediaType}/${mediaId}?profile_id=${pid}`);
      const result = await response.json();
      if (result.success && result.data) {
        setProgress(result.data.progress);
        setProgressData(result.data);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }

  async function checkInList() {
    try {
      const pid = window.currentProfileId || 1;
      const response = await fetch(`${window.API_BASE_URL}/list/check/${mediaType}/${mediaId}?profile_id=${pid}`);
      const result = await response.json();
      if (result.success) {
        setInList(result.in_list);
      }
    } catch (error) {
      console.error('Failed to check list:', error);
    }
  }

  async function toggleList() {
    const pid = window.currentProfileId || 1;
    try {
      if (inList) {
        await fetch(`${window.API_BASE_URL}/list/remove/${mediaType}/${mediaId}?profile_id=${pid}`, { method: 'DELETE' });
        setInList(false);
      } else {
        await fetch(`${window.API_BASE_URL}/list/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: pid,
            media_id: mediaId,
            media_type: mediaType,
            title: item.title,
            poster: item.poster || '',
            backdrop: item.backdrop || '',
            tone: item.tone || '#5BB7FF'
          })
        });
        setInList(true);
      }
      window.clearCacheEntry(`/list?profile_id=${pid}`);
    } catch (error) {
      console.error('Failed to toggle list:', error);
    }
  }

  async function downloadItem(season, episode, epTitle) {
    const key = season ? `s${season}e${episode}` : 'movie';
    if (downloading === key) return;
    setDownloading(key);
    try {
      // Resolve stream URL first (uses cache when available)
      const pid = window.currentProfileId || 1;
      let streamUrl = `${window.API_BASE_URL}/stream/${mediaType}/${mediaId}`;
      const sp = new URLSearchParams();
      if (item.imdb_id) sp.set('imdbId', item.imdb_id);
      if (season)  { sp.set('season', season); sp.set('episode', episode); }
      const result = await fetch(`${streamUrl}?${sp}`).then(r => r.json());
      if (!result.success) throw new Error(result.error || 'Stream not found');

      const { stream_url, filename } = result.data;
      const dlTitle = epTitle || item.title;
      const proxyParams = new URLSearchParams({ url: stream_url, download: '1', dlname: dlTitle });
      if (filename) proxyParams.set('filename', filename);
      window.location.href = `${window.API_BASE_URL}/stream/proxy?${proxyParams}`;
    } catch (err) {
      console.error('Download failed:', err);
      alert('Could not start download: ' + err.message);
    } finally {
      setTimeout(() => setDownloading(null), 4000);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '80px var(--gutter)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
        <div style={{ fontSize: '18px', color: 'var(--txt-1)' }}>Loading details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: '80px var(--gutter)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <div style={{ fontSize: '18px', color: 'var(--txt-1)', marginBottom: '24px' }}>Content not found</div>
        <button className="btn btn--glass" onClick={() => navigate('home')}>Back to Home</button>
      </div>
    );
  }

  const hasProgress = progress > 0;
  const overview = item.overview || item.synopsis || 'No description available.';
  const shouldTruncate = overview.length > 300;
  const displayText = (!expanded && shouldTruncate) ? overview.slice(0, 300) + '...' : overview;

  return (
    <div className="detail-page">
      {/* Hero Backdrop / Trailer */}
      <div className="detail-hero" style={{ '--detail-tone': item.tone }}>
        <img
          src={item.backdrop_large || item.backdrop || backdropUrl(item)}
          alt=""
          className={'detail-hero__img' + (showTrailer ? ' detail-hero__img--hidden' : '')}
        />

        {/* Trailer iframe — autoplays muted on desktop; tap-to-play inline on iOS */}
        {showTrailer && trailerKey && (
          <iframe
            className={'detail-hero__trailer' + (IS_IOS ? ' detail-hero__trailer--ios' : '')}
            src={IS_IOS
              ? `https://www.youtube.com/embed/${trailerKey}?autoplay=0&rel=0&playsinline=1&modestbranding=1`
              : `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&rel=0&playsinline=1&modestbranding=1`}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        )}

        {/* Dismiss button — shown once trailer is in the banner */}
        {showTrailer && (
          <button
            className="detail-hero__trailer-dismiss"
            onClick={() => { setShowTrailer(false); clearTimeout(trailerTimerRef.current); }}
            aria-label="Close trailer"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}

        {/* iOS: Watch Trailer button — tapping it swaps backdrop for the iframe */}
        {showTrailerBtn && !showTrailer && trailerKey && (
          <button className="detail-hero__trailer-btn" onClick={() => setShowTrailer(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Watch Trailer
          </button>
        )}

        <div className="detail-hero__scrim"></div>
        <div className="detail-hero__tone"></div>
      </div>

      {/* Content */}
      <div className="detail-content">
        <button className="back-button detail-back" onClick={() => {
          const dest = mediaType === 'movie' ? 'movies' : mediaType === 'anime' ? 'anime' : 'tv';
          window.navigate(dest);
        }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m15 6-6 6 6 6"/>
          </svg>
          Back
        </button>

        <div className="detail-main">
          {/* Poster */}
          <div className="detail-poster">
            <img src={item.poster || posterUrl(item)} alt={item.title} />
            <div className="detail-poster__glow" style={{ background: `radial-gradient(circle at 50% 100%, ${item.tone}40 0%, transparent 70%)` }}></div>
          </div>

          {/* Info */}
          <div className="detail-info">
            <h1 className="detail-title">{item.title}</h1>

            <div className="detail-meta">
              {item.year && <span>{item.year}</span>}
              {item.rating && <><span className="meta-sep">•</span><span className="rating-badge">{item.rating}</span></>}
              {item.runtime && <><span className="meta-sep">•</span><span>{item.runtime}</span></>}
              {item.vote_average && (
                <>
                  <span className="meta-sep">•</span>
                  <span className="star-rating">★ {item.vote_average.toFixed(1)}</span>
                </>
              )}
            </div>

            {item.genre && (
              <div className="detail-genres">
                {item.genre.split(' · ').map((g, i) => (
                  <span key={i} className="genre-tag">{g}</span>
                ))}
              </div>
            )}

            {/* Play/Resume Section */}
            <div className="detail-actions">
              <button
                className="btn btn--primary btn--large"
                onClick={() => {
                  if ((mediaType === 'tv' || mediaType === 'anime') && item.seasons && item.seasons.length > 0) {
                    playEpisode(1, 1);
                  } else {
                    const posterP   = encodeURIComponent(item.poster   || '');
                    const backdropP = encodeURIComponent(item.backdrop || '');
                    const toneP     = encodeURIComponent(item.tone     || '#5BB7FF');
                    const idKey2    = item.imdb_id ? `imdb=${item.imdb_id}` : `tmdb=${item.tmdb_id}`;
                    const embedSrc  = `https://vidsrc-embed.ru/embed/movie?${idKey2}`;
                    const imdbParam = item.imdb_id ? `&imdbId=${item.imdb_id}` : '';
                    window.location.href = `/player.html?type=${mediaType}&id=${mediaId}&title=${encodeURIComponent(item.title)}&src=${encodeURIComponent(embedSrc)}&poster=${posterP}&backdrop=${backdropP}&tone=${toneP}${imdbParam}`;
                  }
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="currentColor" d="M8 5v14l11-7z"/>
                </svg>
                {hasProgress ? 'Resume' : 'Play'}
              </button>

              {/* Start Over — only shown when there's saved progress */}
              {hasProgress && (
                <button
                  className="btn btn--glass btn--large"
                  onClick={() => {
                    if ((mediaType === 'tv' || mediaType === 'anime') && item.seasons && item.seasons.length > 0) {
                      playEpisode(1, 1, true);
                    } else {
                      const posterP   = encodeURIComponent(item.poster   || '');
                      const backdropP = encodeURIComponent(item.backdrop || '');
                      const toneP     = encodeURIComponent(item.tone     || '#5BB7FF');
                      const idKey2    = item.imdb_id ? `imdb=${item.imdb_id}` : `tmdb=${item.tmdb_id}`;
                      const embedSrc  = `https://vidsrc-embed.ru/embed/movie?${idKey2}`;
                      const imdbParam = item.imdb_id ? `&imdbId=${item.imdb_id}` : '';
                      window.location.href = `/player.html?type=${mediaType}&id=${mediaId}&title=${encodeURIComponent(item.title)}&src=${encodeURIComponent(embedSrc)}&poster=${posterP}&backdrop=${backdropP}&tone=${toneP}${imdbParam}&startOver=1`;
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  Start Over
                </button>
              )}

              <button className="btn btn--glass btn--large" onClick={toggleList}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  {inList ? (
                    <path d="M5 13l4 4L19 7"/>
                  ) : (
                    <path d="M12 5v14M5 12h14"/>
                  )}
                </svg>
                {inList ? 'In My List' : 'My List'}
              </button>
              <button className="btn btn--glass btn--icon btn--large" aria-label="Share">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
              </button>

              {/* Download — movies only; TV has per-episode buttons */}
              {mediaType === 'movie' && (
                <button
                  className={'btn btn--glass btn--icon btn--large' + (downloading === 'movie' ? ' is-loading' : '')}
                  aria-label="Download"
                  onClick={() => downloadItem(null, null, item.title)}
                  disabled={downloading === 'movie'}
                >
                  {downloading === 'movie' ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" opacity="0.25"/>
                      <path d="M12 2 A10 10 0 0 1 22 12" opacity="0.75">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                      </path>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {hasProgress && (
              <div className="detail-progress">
                {progressData?.season > 0 && (
                  <div className="detail-progress-episode">
                    S{progressData.season} E{progressData.episode}
                  </div>
                )}
                <div className="detail-progress-bar">
                  <div
                    className="detail-progress-fill"
                    style={{
                      width: `${progress * 100}%`,
                      background: `linear-gradient(90deg, ${item.tone}, white)`
                    }}
                  ></div>
                </div>
                <div className="detail-progress-text">
                  {Math.round(progress * 100)}% watched • {Math.round((1 - progress) * 120)} min remaining
                </div>
              </div>
            )}

            {/* Description */}
            <div className="detail-description">
              <h2 className="detail-section-title">Overview</h2>
              <p className="detail-overview">
                {displayText}
                {shouldTruncate && (
                  <button
                    className="see-more-btn"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? 'Show less' : 'See more'}
                  </button>
                )}
              </p>
            </div>

            {/* Cast / Additional Info */}
            {item.cast && item.cast.length > 0 && (
              <div className="detail-cast">
                <h3 className="detail-subsection-title">Cast</h3>
                <div className="detail-cast-list">
                  {item.cast.slice(0, 5).map((actor, i) => (
                    <div key={i} className="cast-member">
                      <span className="cast-name">{actor.name}</span>
                      <span className="cast-character">{actor.character}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seasons & Episodes — TV/Anime only */}
        {(mediaType === 'tv' || mediaType === 'anime') && item && item.seasons && item.seasons.length > 0 && (
          <div className="detail-seasons">
            <div className="seasons-header">
              <h2 className="detail-section-title">Episodes</h2>
              <div className="season-selector">
                <button
                  className="season-dropdown-btn"
                  onClick={() => setSeasonDropdownOpen(o => !o)}
                >
                  {item.seasons.find(s => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d={seasonDropdownOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/>
                  </svg>
                </button>
                {seasonDropdownOpen && (
                  <div className="season-dropdown">
                    {item.seasons.map(s => (
                      <button
                        key={s.season_number}
                        className={`season-option${s.season_number === selectedSeason ? ' active' : ''}`}
                        onClick={() => { setSelectedSeason(s.season_number); setSeasonDropdownOpen(false); }}
                      >
                        <span>{s.name}</span>
                        <span className="season-ep-count">{s.episode_count} ep</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {episodesLoading ? (
              <div className="episodes-loading">Loading episodes...</div>
            ) : (
              <div className="episodes-list">
                {episodes.map(ep => (
                  <div key={ep.episode_number} className="episode-card" onClick={() => playEpisode(selectedSeason, ep.episode_number)}>
                    <div className="episode-still">
                      {ep.still
                        ? <img src={ep.still} alt={ep.name} loading="lazy" />
                        : (
                          <div className="episode-still-placeholder">
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        )
                      }
                      <div className="episode-play-overlay">
                        <svg viewBox="0 0 24 24" width="40" height="40">
                          <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.95)"/>
                          <path fill="#08090d" d="M10 8v8l6-4z"/>
                        </svg>
                      </div>
                      <div className="episode-num-badge">E{ep.episode_number}</div>
                    </div>
                    <div className="episode-info">
                      <div className="episode-info-top">
                        <div className="episode-title">{ep.name}</div>
                        <button
                          className="episode-dl-btn"
                          aria-label="Download episode"
                          disabled={downloading === `s${selectedSeason}e${ep.episode_number}`}
                          onClick={e => { e.stopPropagation(); downloadItem(selectedSeason, ep.episode_number, `${item.title}.S${String(selectedSeason).padStart(2,'0')}E${String(ep.episode_number).padStart(2,'0')}`); }}
                        >
                          {downloading === `s${selectedSeason}e${ep.episode_number}` ? (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <circle cx="12" cy="12" r="10" opacity="0.25"/>
                              <path d="M12 2 A10 10 0 0 1 22 12" opacity="0.75">
                                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                              </path>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="episode-meta">
                        {ep.runtime ? <span>{ep.runtime}m</span> : null}
                        {ep.vote_average > 0 ? <span>★ {ep.vote_average.toFixed(1)}</span> : null}
                      </div>
                      {ep.overview ? (
                        <p className="episode-overview">
                          {ep.overview.length > 140 ? ep.overview.slice(0, 140) + '…' : ep.overview}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Similar Content */}
        {similar.length > 0 && (
          <div className="detail-similar">
            <h2 className="detail-section-title">More Like This</h2>
            <div className="detail-similar-grid">
              {similar.map(similarItem => {
                const fullItem = ITEMS[similarItem.id] || similarItem;
                return (
                  <div
                    key={similarItem.id}
                    className="similar-card"
                    onClick={() => {
                      const [type, id] = similarItem.id.split('_');
                      navigate(`detail/${type}/${id}`);
                    }}
                  >
                    <div className="similar-card__poster">
                      <img src={fullItem.poster || landscapeUrl(fullItem)} alt={fullItem.title} />
                      <div className="similar-card__overlay">
                        <svg viewBox="0 0 24 24" width="32" height="32">
                          <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.95)" />
                          <path fill="#08090d" d="M10 8v8l6-4z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="similar-card__info">
                      <div className="similar-card__title">{fullItem.title}</div>
                      <div className="similar-card__meta">
                        {fullItem.year} • {fullItem.rating}
                        {fullItem.vote_average && ` • ★ ${fullItem.vote_average.toFixed(1)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export to global scope
Object.assign(window, { DetailPage });
