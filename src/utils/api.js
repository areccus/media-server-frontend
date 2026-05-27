// API utilities and data fetching

const BACKEND_PORTS = [5001, 5000];
let API_BASE_URL = `http://localhost:${BACKEND_PORTS[0]}/api`;

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function detectBackendPort() {
  for (const port of BACKEND_PORTS) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        API_BASE_URL = `http://localhost:${port}/api`;
        console.log(`✅ Connected to backend on port ${port}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  console.error('❌ Could not connect to backend');
  return false;
}

export async function fetchWithCache(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  const now = Date.now();

  // Check cache
  if (cache.has(url)) {
    const { data, timestamp } = cache.get(url);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    const data = json.data || json;

    // Store in cache
    cache.set(url, { data, timestamp: now });
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

export function clearCache() {
  cache.clear();
}
