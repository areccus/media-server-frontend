/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                         FRONTEND DATA LAYER                                  ║
║                    API Integration & Client Caching                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

📚 PURPOSE:
This file is the BRIDGE between the frontend (what you see) and the backend (the API).
It handles:
  1. Finding the backend server (port detection)
  2. Fetching data from backend API endpoints
  3. Caching responses in browser memory (8-hour TTL)
  4. Providing fallback data if backend is unavailable
  5. Making data available to React components

Think of this as the "Data Manager" for the frontend!

🔄 DATA FLOW:
  React Component → data.jsx → Backend API → TMDB → Backend → data.jsx → React Component
       ↑                                                                        ↓
       └────────────────────────────────────────────────────────────────────────┘
                              (data flows in a circle)

💾 WHY CLIENT-SIDE CACHING?
Even though the backend caches TMDB responses for 8 hours, we ALSO cache on the
client side because:
  1. Faster: No network request needed if data is already in memory
  2. Offline support: Can show cached data even if backend is down
  3. Reduced backend load: Fewer requests = faster backend
  4. Better UX: Instant page loads when navigating back to previous pages

⚡ KEY FEATURES:
  - Automatic port detection (tries 5001, then 5000)
  - Tailscale support (uses window.location.hostname instead of hardcoded localhost)
  - 8-hour cache matching backend TTL
  - Fallback data when backend unavailable
  - Global state management (ITEMS, HERO_LIST, ROWS)

🌐 TAILSCALE SUPPORT:
Instead of hardcoding "localhost", we use window.location.hostname which means:
  - On computer: http://localhost:8080 → Backend at localhost:5001
  - On phone: http://192.168.1.5:8080 → Backend at 192.168.1.5:5001
  - With Tailscale: http://mac-mini.tailscale.net:8080 → Backend at mac-mini.tailscale.net:5001

This makes remote access work automatically!

📦 WHAT THIS FILE EXPORTS:
Global variables (available everywhere):
  - ITEMS: Object mapping item IDs to item data (e.g., ITEMS['movie_550'] = Fight Club data)
  - HERO_LIST: Array of item IDs for hero carousel (e.g., ['movie_550', 'tv_1234'])
  - ROWS: Array of row objects for homepage (trending, recommended, etc.)
  - posterUrl(): Get poster image URL for an item
  - backdropUrl(): Get backdrop image URL for an item
  - landscapeUrl(): Get landscape image URL for an item
  - initializeData(): Load all data from backend
  - fetchWithCache(): Make cached API requests
  - API_BASE_URL: Current backend URL

🔧 HOW TO USE:
In React components:
  await window.initializeData();  // Load all data
  const item = window.ITEMS['movie_550'];  // Get Fight Club
  const posterUrl = window.posterUrl(item);  // Get poster URL
*/

// ═══════════════════════════════════════════════════════════════════════════
// BACKEND CONNECTION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// List of ports to try for backend (macOS AirPlay often uses 5000)
const BACKEND_PORTS = [5001, 5000];

// Get current host dynamically (supports localhost and Tailscale)
// window.location.hostname returns:
//   - "localhost" when running locally
//   - "192.168.1.5" when accessing from phone on same network
//   - "mac-mini.tailscale.net" when accessing via Tailscale VPN
const CURRENT_HOST = window.location.hostname;

// On HTTPS (Vercel/production) use same-origin immediately so no calls race
// with detectBackendPort() and trigger mixed-content errors.
let API_BASE_URL = window.location.protocol === 'https:'
  ? `${window.location.origin}/api`
  : `http://${CURRENT_HOST}:5000/api`;

// ngrok free tier shows a browser interstitial for any request with a browser
// User-Agent unless this header is present. Patch fetch globally so every API
// call bypasses it without having to touch each call site individually.
if (window.location.protocol === 'https:') {
  const _origFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input?.url ?? '');
    if (url.includes('/api/') || url.startsWith(API_BASE_URL)) {
      init = { ...init, headers: { 'ngrok-skip-browser-warning': '1', ...(init.headers || {}) } };
    }
    return _origFetch(input, init);
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// BACKEND PORT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DETECT WHICH PORT THE BACKEND IS RUNNING ON
 *
 * What it does: Tries to connect to backend on different ports until one works.
 * This is needed because:
 *   - Port 5000 is often taken by macOS AirPlay
 *   - We want to automatically find the right port
 *
 * How it works:
 *   1. Loop through BACKEND_PORTS array [5001, 5000]
 *   2. Try to fetch /api/health endpoint on each port
 *   3. If response is OK, we found the backend!
 *   4. Update API_BASE_URL to use correct port
 *
 * Returns:
 *   - true if backend found
 *   - false if no backend available on any port
 *
 * Timeout: 1 second per port (don't wait too long)
 */
async function detectBackendPort() {
  // When served over HTTPS (Cloudflare tunnel or production), nginx proxies
  // /api/ on the same origin — no port scanning needed
  if (window.location.protocol === 'https:') {
    API_BASE_URL = `${window.location.origin}/api`;
    console.log(`✅ HTTPS detected — using same-origin API: ${API_BASE_URL}`);
    return true;
  }

  // Local dev: scan ports to find Flask
  for (const port of BACKEND_PORTS) {
    try {
      const response = await fetch(`http://${CURRENT_HOST}:${port}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        API_BASE_URL = `http://${CURRENT_HOST}:${port}/api`;
        console.log(`✅ Connected to backend on ${CURRENT_HOST}:${port}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }

  console.warn('⚠️ Could not connect to backend. Using fallback data.');
  return false;
}


// ═══════════════════════════════════════════════════════════════════════════
// CLIENT-SIDE CACHE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CLIENT-SIDE CACHE OBJECT
 *
 * What it stores: API responses in browser memory (RAM, not disk)
 * How it works: Similar to backend cache but lives in the browser
 *
 * Structure:
 *   apiCache = {
 *     data: {
 *       "/hero": [hero items array],
 *       "/trending?type=all": [trending items array],
 *       ...
 *     },
 *     timestamps: {
 *       "/hero": 1234567890123,  (milliseconds since 1970)
 *       "/trending?type=all": 1234567890456,
 *       ...
 *     },
 *     CACHE_DURATION: 28800000  (8 hours in milliseconds)
 *   }
 *
 * Why 8 hours? Matches backend cache TTL so we don't serve stale data
 *
 * Cache lifecycle:
 *   1. First request: Fetch from backend, save to cache
 *   2. Second request: Return from cache (instant!)
 *   3. After 8 hours: Cache expires, fetch from backend again
 */
const apiCache = {
  data: {},
  timestamps: {},
  CACHE_DURATION: 8 * 60 * 60 * 1000,    // 8 hours in-memory
  DISK_DURATION:  24 * 60 * 60 * 1000,  // 24 hours localStorage
};

// localStorage helpers — silent on quota errors
const LS_PREFIX = 'halo_cache_';
function lsGet(endpoint) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + endpoint);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > apiCache.DISK_DURATION) { localStorage.removeItem(LS_PREFIX + endpoint); return null; }
    return { ts, data };
  } catch { return null; }
}
function lsSet(endpoint, data) {
  try { localStorage.setItem(LS_PREFIX + endpoint, JSON.stringify({ ts: Date.now(), data })); } catch {}
}
function clearCacheEntry(endpoint) {
  delete apiCache.data[endpoint];
  delete apiCache.timestamps[endpoint];
  try { localStorage.removeItem(LS_PREFIX + endpoint); } catch {}
}


// ═══════════════════════════════════════════════════════════════════════════
// API REQUEST WITH CACHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * FETCH DATA FROM BACKEND WITH CACHING
 *
 * This is the main function for getting data from the backend. It automatically
 * handles caching so you don't have to think about it!
 *
 * How it works:
 *   1. Check if we have cached data for this endpoint
 *   2. If yes AND not expired: Return cached data (instant!)
 *   3. If no OR expired: Fetch from backend, cache it, return it
 *   4. If backend error: Return fallback data
 *
 * Parameters:
 *   - endpoint: API path like "/hero" or "/trending?type=all"
 *
 * Returns:
 *   - Array or object with data from backend
 *   - Fallback data if backend unavailable
 *
 * Cache check logic:
 *   - Have cached data? ✓
 *   - Have timestamp? ✓
 *   - Less than 8 hours old? (now - timestamp) < CACHE_DURATION
 *     If all three are true → Use cache!
 *
 * Example:
 *   const heroItems = await fetchWithCache('/hero');
 *   // First call: Fetches from backend (slow)
 *   // Second call: Returns from cache (instant!)
 */
// noBackground: skip the background revalidate (use for detail pages — metadata rarely changes)
async function fetchWithCache(endpoint, { noBackground = false } = {}) {
  const now = Date.now();

  // 1. In-memory hit (fastest — same session navigation)
  if (apiCache.data[endpoint] && apiCache.timestamps[endpoint] &&
      (now - apiCache.timestamps[endpoint]) < apiCache.CACHE_DURATION) {
    return apiCache.data[endpoint];
  }

  // 2. localStorage hit
  const disk = lsGet(endpoint);
  if (disk) {
    apiCache.data[endpoint] = disk.data;
    apiCache.timestamps[endpoint] = disk.ts;
    if (!noBackground) fetchFresh(endpoint);
    return disk.data;
  }

  // 3. Cold fetch — nothing cached anywhere
  return fetchFresh(endpoint);
}

async function fetchFresh(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'API error');

    const now = Date.now();
    apiCache.data[endpoint] = result.data;
    apiCache.timestamps[endpoint] = now;
    lsSet(endpoint, result.data);

    return result.data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    // Return in-memory stale data if we have it, otherwise fallback
    return apiCache.data[endpoint] || getFallbackData(endpoint);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK DATA (when backend unavailable)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET FALLBACK DATA WHEN BACKEND IS UNAVAILABLE
 *
 * What it does: Returns placeholder data when backend can't be reached.
 * This prevents the app from crashing and shows a helpful message.
 *
 * Why: Better to show placeholder content than a blank screen or error!
 *
 * Parameters:
 *   - endpoint: The API endpoint that failed (e.g., "/hero")
 *
 * Returns:
 *   - Array of placeholder items with instructions to configure API key
 *
 * What fallback items look like:
 *   {
 *     id: 'fallback_1',
 *     title: 'Media Server',
 *     synopsis: 'Configure your TMDB API key...',
 *     poster: 'https://picsum.photos/seed/placeholder/500/750',  (random image)
 *     tone: '#5BB7FF',  (nice blue color)
 *     ...
 *   }
 */
function getFallbackData(endpoint) {
  // Base fallback item with helpful message
  const fallbackItem = {
    id: 'fallback_1',
    title: 'Media Server',
    year: '2024',
    rating: 'TV-MA',
    runtime: '2h 00m',
    genre: 'Drama',
    meta: 'Movie · 2024',
    tone: '#5BB7FF',  // Nice blue color
    synopsis: 'Configure your TMDB API key in the backend .env file to load real content.',
    poster: 'https://picsum.photos/seed/placeholder/500/750',      // Random placeholder
    backdrop: 'https://picsum.photos/seed/placeholder-bd/1920/1080'  // Random backdrop
  };

  // ───────────────────────────────────────────────────────────────────────
  // Special handling for hero endpoint (needs 5 items with different colors)
  // ───────────────────────────────────────────────────────────────────────

  if (endpoint.includes('hero')) {
    // Create 5 hero items with different colors and titles
    const heroColors = ['#7C5CFF', '#E8623A', '#2BA6E0', '#E2B23A', '#F08CBF'];

    return Array(5).fill(null).map((_, i) => ({
      ...fallbackItem,              // Copy all base properties
      id: `hero_${i}`,              // Unique ID for each hero item
      title: `Featured ${i + 1}`,   // "Featured 1", "Featured 2", etc.
      tone: heroColors[i]           // Different color for each
    }));
  }

  // ───────────────────────────────────────────────────────────────────────
  // Default: Return 8 placeholder items
  // ───────────────────────────────────────────────────────────────────────

  return Array(8).fill(null).map((_, i) => ({
    ...fallbackItem,
    id: `item_${i}`,
    title: `Item ${i + 1}`
  }));
}


// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE VARIABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GLOBAL DATA STORAGE
 *
 * These variables store ALL media data for the app. They're accessible from
 * any React component via window.ITEMS, window.HERO_LIST, etc.
 *
 * Why global? React components need to share the same data. Instead of passing
 * props down through many components, we use global state.
 *
 * ITEMS: Object mapping item IDs to full item data
 *   Example: {
 *     'movie_550': { title: 'Fight Club', year: '1999', ... },
 *     'movie_24': { title: 'Kill Bill', year: '2003', ... },
 *     'tv_1234': { title: 'Breaking Bad', year: '2008', ... }
 *   }
 *
 * HERO_LIST: Array of item IDs for hero carousel
 *   Example: ['movie_550', 'movie_24', 'tv_1234', 'movie_789', 'movie_999']
 *
 * ROWS: Array of row objects for homepage
 *   Example: [
 *     { id: 'tr', label: 'Trending Now', items: ['movie_1', 'movie_2', ...] },
 *     { id: 'rec', label: 'Recommended', items: ['movie_3', 'movie_4', ...] }
 *   ]
 */

// Object to store all media items (movies, TV shows, anime)
// Key = item ID (e.g., "movie_550")
// Value = item data (title, poster, year, etc.)
let ITEMS = {};

// Array of item IDs for hero carousel (the big banner at top)
// Example: ['movie_550', 'tv_1234', 'movie_789']
let HERO_LIST = [];

// Array of row objects for homepage (each row has label and items)
// Example: [{ id: 'trending', label: 'Trending Now', items: [...] }]
let ROWS = [];


// ═══════════════════════════════════════════════════════════════════════════
// DATA INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * INITIALIZE ALL DATA FROM BACKEND
 *
 * This is the MAIN function that loads all data for the app. Called once when
 * app starts up.
 *
 * What it does:
 *   1. Detect which port backend is running on (5001 or 5000)
 *   2. Fetch ALL data in parallel (faster!)
 *      - Hero items (5 featured items)
 *      - Trending (10 items)
 *      - Recommended (10 items)
 *      - Popular movies (10 items)
 *      - Popular TV shows (10 items)
 *      - Anime (10 items)
 *   3. Combine all items into ITEMS object
 *   4. Set up HERO_LIST array
 *   5. Set up ROWS array
 *
 * Why parallel? Using Promise.all() fetches everything at once instead of
 * one-by-one. Much faster!
 *   Sequential: 6 requests × 100ms = 600ms total
 *   Parallel: 6 requests at once = 100ms total (6x faster!)
 *
 * Lazy loading: Images load as you scroll, not all at once. This saves
 * bandwidth and makes initial load much faster.
 *
 * Error handling: If backend fails, uses fallback data so app still works
 */
async function initializeData() {
  try {
    // ───────────────────────────────────────────────────────────────────────
    // STEP 1: Find backend server (port detection)
    // ───────────────────────────────────────────────────────────────────────

    await detectBackendPort();
    window.API_BASE_URL = API_BASE_URL;

    // ───────────────────────────────────────────────────────────────────────
    // STEP 2: Fetch all data in parallel (Promise.all = runs at same time)
    // ───────────────────────────────────────────────────────────────────────

    // Promise.all runs all fetches simultaneously
    // [a, b, c] = await Promise.all([fetch1, fetch2, fetch3])
    // This is MUCH faster than:
    //   const a = await fetch1;
    //   const b = await fetch2;  (waits for a)
    //   const c = await fetch3;  (waits for b)
    const [heroItems, trending, recommended, movies, tvShows, anime] = await Promise.all([
      fetchWithCache('/hero'),                  // 5 featured items
      fetchWithCache('/trending?type=all'),     // 10 trending items
      fetchWithCache('/recommended'),           // 10 recommended movies
      fetchWithCache('/movies'),                // 10 popular movies
      fetchWithCache('/tv'),                    // 10 popular TV shows
      fetchWithCache('/anime')                  // 10 anime shows
    ]);

    // ───────────────────────────────────────────────────────────────────────
    // STEP 3: Combine all items into ITEMS object
    // ───────────────────────────────────────────────────────────────────────

    // Combine all arrays into one big array
    // [...a, ...b] = spread operator, combines arrays
    const allItems = [
      ...heroItems,      // 5 items
      ...trending,       // 10 items
      ...recommended,    // 10 items
      ...movies,         // 10 items
      ...tvShows,        // 10 items
      ...anime           // 10 items
    ];                   // Total: 55 items

    // Convert array to object for fast lookups
    // Array: [item1, item2, item3] → O(n) lookup (slow)
    // Object: { id1: item1, id2: item2 } → O(1) lookup (instant!)
    allItems.forEach(item => {
      ITEMS[item.id] = item;  // Store each item by its ID
    });

    // ───────────────────────────────────────────────────────────────────────
    // STEP 4: Set up HERO_LIST (hero carousel items)
    // ───────────────────────────────────────────────────────────────────────

    // Clear existing array (important for hot-reloading)
    HERO_LIST.length = 0;

    // Add first 5 hero item IDs
    // .map(item => item.id) converts [{id: 'movie_1', ...}, ...] → ['movie_1', ...]
    HERO_LIST.push(...heroItems.slice(0, 5).map(item => item.id));

    // Why push instead of reassign?
    // push modifies existing array (maintains references)
    // reassign creates new array (breaks references in React components)

    // ───────────────────────────────────────────────────────────────────────
    // STEP 5: Set up ROWS (homepage content rows)
    // ───────────────────────────────────────────────────────────────────────

    // Clear existing array
    ROWS.length = 0;

    // Add all content rows
    ROWS.push(
      {
        id: 'tr',                           // Unique row ID
        label: 'Trending Now',              // Display label
        items: trending.map(item => item.id)  // Array of item IDs
      },
      {
        id: 'rec',
        label: 'Recommended For You',
        items: recommended.map(item => item.id)
      },
      {
        id: 'mv',
        label: 'Popular Movies',
        items: movies.map(item => item.id)
      },
      {
        id: 'tv',
        label: 'TV Shows',
        items: tvShows.map(item => item.id)
      },
      {
        id: 'an',
        label: 'Anime',
        items: anime.map(item => item.id)
      }
    );

    // ───────────────────────────────────────────────────────────────────────
    // STEP 6: Log success message
    // ───────────────────────────────────────────────────────────────────────

    console.log('Data loaded successfully:', {
      totalItems: Object.keys(ITEMS).length,  // How many unique items?
      heroItems: HERO_LIST.length,             // Should be 5
      rows: ROWS.length                        // Should be 5
    });

  } catch (error) {
    // ───────────────────────────────────────────────────────────────────────
    // ERROR HANDLING: Backend unavailable - use fallback data
    // ───────────────────────────────────────────────────────────────────────

    console.error('Failed to initialize data:', error);

    // Get fallback data
    const fallbackHero = getFallbackData('/hero');
    const fallbackItems = getFallbackData('/trending');

    // Populate ITEMS with fallback data
    fallbackHero.forEach(item => ITEMS[item.id] = item);
    fallbackItems.forEach(item => ITEMS[item.id] = item);

    // Set up HERO_LIST with fallback data
    HERO_LIST.length = 0;
    HERO_LIST.push(...fallbackHero.map(item => item.id));

    // Set up ROWS with fallback data
    ROWS.length = 0;
    ROWS.push({
      id: 'fallback',
      label: 'Content (API Not Connected)',
      items: fallbackItems.map(item => item.id)
    });
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// IMAGE URL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET POSTER IMAGE URL
 *
 * What it does: Returns full URL to poster image for a media item
 *
 * Poster = vertical movie poster (like in movie theaters)
 * Typical size: 500×750 pixels (2:3 aspect ratio)
 *
 * Parameters:
 *   - item: Media item object
 *   - w: Width in pixels (default 600)
 *   - h: Height in pixels (default 900)
 *
 * Returns: Full URL to poster image
 *
 * Example:
 *   const item = ITEMS['movie_550'];
 *   const url = posterUrl(item);
 *   // Returns: "https://image.tmdb.org/t/p/w500/abc123.jpg"
 *
 * Note: Item already has poster URL from backend, we just return it!
 */
function posterUrl(item, w = 600, h = 900) {
  if (item && item.poster) {
    return item.poster;  // Backend already provided full URL
  }

  // No poster available - return placeholder
  // picsum.photos provides random placeholder images
  // seed ensures same ID always gets same placeholder
  return `https://picsum.photos/seed/${item?.id || 'default'}/${w}/${h}`;
}

/**
 * GET BACKDROP IMAGE URL
 *
 * What it does: Returns full URL to backdrop image for a media item
 *
 * Backdrop = wide horizontal image (used for hero banner)
 * Typical size: 2400×1200 pixels (16:9 aspect ratio)
 *
 * Similar to posterUrl but for wide images
 */
function backdropUrl(item, w = 2400, h = 1200) {
  if (item && item.backdrop) {
    return item.backdrop;  // Backend already provided full URL
  }

  // No backdrop - return placeholder with different seed
  return `https://picsum.photos/seed/${item?.id || 'default'}-bd/${w}/${h}`;
}

/**
 * GET LANDSCAPE IMAGE URL
 *
 * What it does: Returns landscape-oriented image (wider than tall)
 *
 * Landscape = horizontal image for cards and grids
 * Typical size: 800×450 pixels (16:9 aspect ratio)
 *
 * Fallback order:
 *   1. Use poster if available
 *   2. Use backdrop if available
 *   3. Use placeholder
 */
function landscapeUrl(item, w = 800, h = 450) {
  if (item && item.poster) {
    return item.poster;  // Use poster as landscape
  }
  if (item && item.backdrop) {
    return item.backdrop;  // Or use backdrop
  }

  // No images - return placeholder
  return `https://picsum.photos/seed/${item?.id || 'default'}-ls/${w}/${h}`;
}


// ═══════════════════════════════════════════════════════════════════════════
// EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MAKE EVERYTHING AVAILABLE GLOBALLY
 *
 * Why: React components need access to this data. We attach everything to
 * the window object so any component can access it.
 *
 * Alternative: Could use React Context or Redux, but this is simpler for
 * a small app and works great!
 *
 * Usage in React components:
 *   const item = window.ITEMS['movie_550'];
 *   const posterUrl = window.posterUrl(item);
 *   await window.initializeData();
 *
 * Object.assign(target, source) copies all properties from source to target
 *
 * After this runs, you can access:
 *   window.ITEMS
 *   window.HERO_LIST
 *   window.ROWS
 *   window.posterUrl
 *   window.backdropUrl
 *   window.landscapeUrl
 *   window.initializeData
 *   window.fetchWithCache
 *   window.API_BASE_URL
 */
Object.assign(window, {
  ITEMS,              // Global items object
  HERO_LIST,          // Global hero list array
  ROWS,               // Global rows array
  posterUrl,          // Poster URL function
  backdropUrl,        // Backdrop URL function
  landscapeUrl,       // Landscape URL function
  initializeData,     // Data loading function
  fetchWithCache,     // Cached fetch function
  clearCacheEntry,    // Invalidate a single cache entry
  API_BASE_URL        // Current backend URL
});


// ═══════════════════════════════════════════════════════════════════════════
// TROUBLESHOOTING GUIDE
// ═══════════════════════════════════════════════════════════════════════════

/*
COMMON ISSUES AND SOLUTIONS:

1. "Could not connect to backend" warning
   Problem: Backend not running or wrong port
   Solution:
     - Check backend is running: ./start.sh
     - Check console logs for port number
     - Try http://localhost:5001/api/health in browser
     - Check firewall settings if accessing from another device

2. Fallback data showing ("Media Server" placeholders)
   Problem: Backend not responding or TMDB API key not set
   Solution:
     - Check backend logs for errors
     - Verify TMDB_API_KEY in backend/.env
     - Test backend endpoints: curl http://localhost:5001/api/hero
     - Check network tab in browser DevTools

3. Cache not working (always fetching from backend)
   Problem: Cache may be disabled or corrupted
   Solution:
     - Open browser console and check for cache HIT/MISS messages
     - Clear browser cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
     - Check apiCache object in console: console.log(apiCache)

4. Images not loading
   Problem: TMDB image URLs may be blocked or invalid
   Solution:
     - Check browser console for failed image requests
     - Test image URL directly in browser
     - Check if item.poster and item.backdrop are valid URLs
     - Firewall might be blocking TMDB CDN

5. Data not updating after backend changes
   Problem: Client cache still valid (8-hour TTL)
   Solution:
     - Wait 8 hours for cache to expire (automatic)
     - OR force reload: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
     - OR clear cache in code: apiCache.data = {}; apiCache.timestamps = {}
     - OR change CACHE_DURATION to shorter time (e.g., 5 minutes)

6. Tailscale not working
   Problem: Backend URL not resolving correctly
   Solution:
     - Check CURRENT_HOST value: console.log(CURRENT_HOST)
     - Verify Tailscale is running on both devices
     - Check firewall allows port 5001 and 8080
     - Test backend URL: http://[tailscale-host]:5001/api/health
*/


// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMIZATION IDEAS
// ═══════════════════════════════════════════════════════════════════════════

/*
HOW TO CUSTOMIZE THIS FILE:

1. Change cache duration
   Line: 169 (CACHE_DURATION)
   Change: CACHE_DURATION: 8 * 60 * 60 * 1000
   To: CACHE_DURATION: 1 * 60 * 60 * 1000  // 1 hour instead of 8

2. Add more backend ports to try
   Line: 62 (BACKEND_PORTS)
   Change: const BACKEND_PORTS = [5001, 5000];
   To: const BACKEND_PORTS = [5001, 5000, 5002, 3000];

3. Increase port detection timeout
   Line: 100 (AbortSignal.timeout)
   Change: signal: AbortSignal.timeout(1000)
   To: signal: AbortSignal.timeout(3000)  // Wait 3 seconds instead of 1

4. Add localStorage caching (survives page reloads)
   Currently: Cache in memory (apiCache object)
   Could: Save cache to localStorage
   Example:
     localStorage.setItem('mediaCache', JSON.stringify(apiCache));
     const cached = JSON.parse(localStorage.getItem('mediaCache'));

5. Add request queue for better error handling
   Currently: Requests fail silently and use fallback
   Could: Queue failed requests and retry when backend comes back online

6. Add loading states
   Currently: Returns fallback data immediately
   Could: Return loading indicators while fetching
   Example:
     return { loading: true, data: null };

7. Add request deduplication
   Currently: Multiple simultaneous requests for same endpoint
   Could: Deduplicate so only one request is made
   Example:
     const pendingRequests = {};
     if (pendingRequests[endpoint]) return pendingRequests[endpoint];

8. Add prefetching
   Currently: Fetch data when needed
   Could: Prefetch likely-needed data in advance
   Example: When hovering over movie card, prefetch its details

NEXT STEPS:
  - Monitor cache hit rate in console
  - Add cache warming (pre-fetch popular content)
  - Consider adding Redux for better state management
  - Add WebSocket support for real-time updates
  - Implement service worker for offline support
*/
