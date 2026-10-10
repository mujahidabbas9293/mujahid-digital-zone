import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automatically inject X-License-Key on internal API requests
if (typeof window !== 'undefined') {
  const nativeFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      const customBackend = (localStorage.getItem('mdz_custom_backend_url') || '').trim();

      // Only rewrite if custom server URL is explicitly set by user in localStorage
      if (customBackend && urlStr.startsWith('/api/')) {
        const newUrl = customBackend.replace(/\/$/, '') + urlStr;
        return nativeFetch(newUrl, init);
      }

      if (urlStr.startsWith('/api/') || urlStr.includes('/api/')) {
        const storedKey = localStorage.getItem('mdz_active_license_key');
        if (storedKey) {
          const headers = new Headers(init?.headers || {});
          if (!headers.has('X-License-Key')) {
            headers.set('X-License-Key', storedKey);
          }
          init = { ...init, headers };
        }
      }
    } catch (_) {}
    return nativeFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(<App />);
