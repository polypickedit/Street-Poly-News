
import React from 'react';

export const DevDebugBanner = () => {
  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-2 right-2 bg-black/80 text-white text-xs p-2 rounded z-[9999] pointer-events-none font-mono">
      ENV: {import.meta.env.VITE_SUPABASE_URL}
    </div>
  );
};
