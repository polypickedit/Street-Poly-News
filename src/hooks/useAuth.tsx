import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/contexts/AuthContextInternal';

/**
 * useAuth hook to access authentication state and methods.
 * This hook must be used within an AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Hard logging for render state tracking to debug performance/stalls
  console.log("[useAuth] render", { 
    loading: context.loading, 
    hasSession: !!context.session,
    isAdmin: context.isAdmin,
    userId: context.user?.id 
  });
  
  return context;
};
