import { createRoot } from 'react-dom/client';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import './index.css';

const CANONICAL_HOST = import.meta.env.VITE_CANONICAL_HOST?.trim().toLowerCase() ?? '';
const CANONICAL_PROTOCOL = import.meta.env.VITE_CANONICAL_PROTOCOL?.trim().toLowerCase() ?? 'https';

const isLocalHost = (host: string) => host === 'localhost' || host === '127.0.0.1' || host === '::1';

const enforceCanonicalOrigin = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!CANONICAL_HOST) return false;

  const currentHost = window.location.hostname.toLowerCase();
  if (isLocalHost(currentHost)) return false;

  const targetProtocol = CANONICAL_PROTOCOL === 'http' ? 'http:' : 'https:';
  const protocolMismatch = window.location.protocol !== targetProtocol;
  const hostMismatch = currentHost !== CANONICAL_HOST;

  if (!protocolMismatch && !hostMismatch) {
    return false;
  }

  const redirectUrl = `${targetProtocol}//${CANONICAL_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(redirectUrl);
  return true;
};

// Environment Guard
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Render Fatal Error Screen directly, bypassing App initialization
  console.error('CRITICAL: Missing Supabase environment variables');
  
  import('./components/FatalError').then(({ FatalError }) => {
    const root = createRoot(document.getElementById('root')!);
    root.render(<FatalError />);
  }).catch((err) => {
    document.body.innerHTML = `
      <div style="display: flex; height: 100vh; justify-content: center; align-items: center; background: #000; color: #fff; font-family: system-ui, sans-serif;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">Fatal Configuration Error</h1>
          <p>Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.</p>
          <p style="opacity: 0.7; margin-top: 0.5rem;">Check console for details.</p>
        </div>
      </div>
    `;
    console.error('Failed to load FatalError component:', err);
  });
} else {
  // Canonical Redirect (Only if auth config is valid)
  if (enforceCanonicalOrigin()) {
    // Halt startup; browser is navigating to the canonical origin.
  } else {
    // Only import App if environment is valid
    import('./App').then(({ default: App }) => {
      if (import.meta.env.DEV) {
        console.log('ENV: Configuration valid, starting app...');
      }
      
      if (import.meta.env.PROD && typeof window !== 'undefined') {
        const host = window.location.hostname;
        const isLocal = isLocalHost(host);
        if (!isLocal) {
          try {
            injectSpeedInsights();
          } catch {
            void 0;
          }
        }
      }

      createRoot(document.getElementById('root')!).render(
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      );
    });
  }
}
