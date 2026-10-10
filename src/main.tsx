import React, { Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Caught unhandled application error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('mdz_custom_backend_url');
    } catch (_) {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto text-2xl font-bold">
              ⚠️
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white tracking-tight">Mujahid Digital Zone</h1>
              <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Application Recovery System</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected rendering error was safely intercepted by the Global Error Boundary.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-left overflow-x-auto">
              <p className="text-[11px] font-mono text-rose-300 break-words">
                {this.state.error?.message || 'Unknown application error'}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Reset Session & Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
        const headers = new Headers(init?.headers || {});
        headers.set('bypass-tunnel-remainder', 'true');
        headers.set('Bypass-Tunnel-Remainder', 'true');
        if (storedKey && !headers.has('X-License-Key')) {
          headers.set('X-License-Key', storedKey);
        }
        init = { ...init, headers };
      }
    } catch (_) {}
    return nativeFetch(input, init);
  };
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  );
}
