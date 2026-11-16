import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In Docker, PROXY_TARGET is set to http://gateway:3000.
// For local dev, it defaults to http://localhost:3000.
const proxyTarget = process.env.PROXY_TARGET || 'http://localhost:3000';

/** Forward the Authorization cookie as an Authorization header so that
 *  browser-initiated requests (e.g. <img src="...">) that only carry
 *  cookies are still authenticated by the backend. */
function forwardAuthCookie(proxy) {
  proxy.on('proxyReq', (proxyReq, req) => {
    if (proxyReq.getHeader('authorization')) return;
    const cookie = req.headers.cookie;
    if (!cookie) return;
    const match = cookie.split('; ').find((c) => c.startsWith('Authorization='));
    if (match) {
      try {
        const value = decodeURIComponent(match.substring('Authorization='.length));
        proxyReq.setHeader('Authorization', value);
      } catch { /* malformed cookie value – skip */ }
    }
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/auth': proxyTarget,
      '/article': {
        target: proxyTarget,
        // Don't proxy direct browser navigation (HTML requests) so the SPA
        // handles client-side routes like /article/:slug.
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        },
        configure: forwardAuthCookie,
      },
      '/users': {
        target: proxyTarget,
        configure: forwardAuthCookie,
      },
    },
  },
});
