// Vercel Edge Middleware — runs before every /api/* request.
// Proxies to the ngrok backend with ngrok-skip-browser-warning injected so that
// the iOS <video> element (which can't set custom headers) bypasses the ngrok
// browser interstitial that causes "Format not supported".

const BACKEND = 'https://lance-aloof-deodorize.ngrok-free.dev';

export const config = { matcher: '/api/:path*' };

export default async function middleware(request) {
    const url = new URL(request.url);
    const targetUrl = BACKEND + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.set('ngrok-skip-browser-warning', '1');
    // Prevent Vercel-injected forwarding headers from confusing the backend
    headers.delete('x-forwarded-host');

    const upstream = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        // @ts-ignore — needed for streaming request bodies in edge runtime
        duplex: 'half',
    });

    return new Response(upstream.body, {
        status: upstream.status,
        headers: upstream.headers,
    });
}
