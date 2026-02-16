import { createRoot } from 'react-dom/client';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import './index.css';

// Environment Guard
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Render Fatal Error Screen directly, bypassing App initialization
  console.error('CRITICAL: Missing Supabase environment variables');
  
  // Dynamic import to avoid bundling dependencies if not needed, 
  // but for simplicity we'll render a basic error if components fail to load
  import('./components/FatalError').then(({ FatalError }) => {
    const root = createRoot(document.getElementById('root')!);
    root.render(<FatalError />);
  }).catch((err) => {
    // Fallback if even the error component fails
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
  // Only import App if environment is valid
  // This prevents the Supabase client from initializing and throwing
  import('./App').then(({ default: App }) => {
    console.log('ENV: Configuration valid, starting app...');
    
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
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
