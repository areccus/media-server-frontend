import { useState, useEffect } from 'react';

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

  return {
    page: page,
    params: parts.slice(1)
  };
}

export function useRouter() {
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
