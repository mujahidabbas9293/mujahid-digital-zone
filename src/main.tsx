import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automatically inject X-License-Key on all internal API requests
if (typeof window !== 'undefined') {
  const nativeFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith('/api/') || url.includes('/api/')) {
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
