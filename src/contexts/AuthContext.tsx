import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextInternal';
import { safeQuery } from '@/lib/supabase-debug';

type SessionResponse = Awaited<ReturnType<typeof supabase.auth.getSession>>;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const lastRoleCheckRef = useRef<number>(0);

  const sessionFetchPromiseRef = useRef<Promise<SessionResponse> | null>(null);
  const sessionFetchControllerRef = useRef<AbortController | null>(null);

  const resetRoles = useCallback(() => {
    setIsAdmin(false);
    setIsEditor(false);
  }, []);

  const hydrateRole = useCallback(
    async (userId: string, { force = false } = {}) => {
      const now = Date.now();
      if (!force && now - lastRoleCheckRef.current < 2000) {
        return;
      }
      lastRoleCheckRef.current = now;

      try {
        console.log('Auth: Hydrating roles for', userId, { force });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout (must be < global 5s timeout)

        try {
          console.log('Auth: RPC hydration started');
          const [adminAccess, editorAccess] = await Promise.all([
            safeQuery(supabase.rpc('is_admin').abortSignal(controller.signal)),
            safeQuery(supabase.rpc('is_admin_or_editor').abortSignal(controller.signal)),
          ]);
          
          clearTimeout(timeoutId);

          console.log('Auth: RPC role hydration results:', { adminAccess, editorAccess });
          setIsAdmin(!!adminAccess);
          setIsEditor(!!editorAccess);
          return;
        } catch (rpcErr) {
          clearTimeout(timeoutId);
          console.warn('Auth: RPC role hydration failed, falling back to table query:', rpcErr);
        }

        try {
          const roles = await safeQuery(
            supabase
            .from('user_roles')
            .select('role_id, roles(name)')
            .eq('user_id', userId)
            .abortSignal(controller.signal)
          );

          if (roles) {
            const typedRoles = roles as { roles: { name: string } | null }[];
            const admin = typedRoles.some((r) => r.roles?.name === 'admin');
            const editor = admin || typedRoles.some((r) => r.roles?.name === 'editor');
            console.log('Auth: Table role hydration results:', { admin, editor });
            setIsAdmin(admin);
            setIsEditor(editor);
            return;
          }
        } catch (tableErr) {
           console.error('Auth: Error fetching roles from table:', tableErr);
           // proceed to resetRoles
        }
        
        resetRoles();
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          console.log('Auth: Role hydration aborted (timeout or page refresh)');
        } else {
          console.error('Auth: Error hydrating roles:', err);
        }
        resetRoles();
      }
    },
    [resetRoles]
  );

  const fetchSessionOnce = useCallback(async (): Promise<SessionResponse> => {
    if (sessionFetchPromiseRef.current) {
      return sessionFetchPromiseRef.current;
    }

    const controller = new AbortController();
    sessionFetchControllerRef.current = controller;

    const promise = (async () => {
      let timeoutId: ReturnType<typeof setTimeout>;
      
      try {
        const timeoutPromise = new Promise<SessionResponse>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session fetch timed out')), 4000);
        });

        const sessionPromise = supabase.auth.getSession();
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
      } catch (err) {
        clearTimeout(timeoutId!);
        throw err;
      } finally {
        sessionFetchControllerRef.current = null;
        sessionFetchPromiseRef.current = null;
      }
    })();

    sessionFetchPromiseRef.current = promise;
    return promise;
  }, []);

  const abortPendingSessionFetch = useCallback(() => {
    sessionFetchControllerRef.current?.abort();
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      console.log('Auth: refreshAuth started');
      setLoading(true);
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await fetchSessionOnce();

      if (sessionError) {
        throw sessionError;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user?.id) {
        await hydrateRole(currentSession.user.id, { force: true });
      } else {
        resetRoles();
      }
    } catch (error) {
      console.error('Auth: Refresh error:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchSessionOnce, hydrateRole, resetRoles]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      let shouldSetReady = true;
      try {
        console.log('Auth: Initializing...');
        const response = await fetchSessionOnce();
        const { data: { session: initialSession }, error } = response;

        if (error) {
          // Check for AbortError or DOMException from Supabase navigatorLock
          if (
            error.name === 'AbortError' || 
            error.message?.includes('AbortError') ||
            error.message?.includes('The operation was aborted')
          ) {
            console.log('Auth: Session fetch aborted (likely due to OAuth redirect race). Waiting for listener...');
            shouldSetReady = false;
            return;
          }
          console.error('Auth: Initial session error:', error);
        }

        if (!mounted) {
          return;
        }

        console.log('Auth: Initial session fetched', { hasSession: !!initialSession, userId: initialSession?.user?.id });
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user?.id) {
          console.log('Auth: Hydrating roles for initial session...');
          await hydrateRole(initialSession.user.id, { force: true });
        } else {
          resetRoles();
        }
      } catch (err) {
        // Check for AbortError or DOMException
        if (
          err instanceof Error && (
            err.name === 'AbortError' || 
            err.message.includes('AbortError') ||
            err.message.includes('The operation was aborted')
          )
        ) {
          console.log('Auth: Initialization aborted. Waiting for listener...');
          shouldSetReady = false;
          return;
        }
        console.error('Auth: Initialization failed:', err);
      } finally {
        if (mounted && shouldSetReady) {
          console.log('Auth: Initialization complete. Setting authReady=true');
          setAuthReady(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth: State change event:', event, {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
        });

        setLoading(true);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        try {
          if (currentSession?.user?.id) {
            await hydrateRole(currentSession.user.id, { force: true });
          } else {
            resetRoles();
          }
        } catch (err) {
          console.error('Auth: State change hydration error:', err);
        } finally {
          if (mounted) {
            setLoading(false);
            setAuthReady(true); // Ensure auth is marked ready after state change
          }
        }
      }
    );

    return () => {
      mounted = false;
      abortPendingSessionFetch();
      subscription.unsubscribe();
    };
  }, [abortPendingSessionFetch, fetchSessionOnce, hydrateRole, resetRoles]);

  // Fail-safe timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading) {
           console.error("⚠️ Auth stuck in loading state for > 5s. Forcing ready.");
           setAuthReady(true);
           return false;
        }
        return currentLoading;
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      isAdmin,
      isEditor,
      loading,
      authReady,
      refreshAuth,
    }),
    [session, user, isAdmin, isEditor, loading, authReady, refreshAuth]
  );

  useEffect(() => {
    console.log('Auth State Update:', {
      loading,
      hasSession: !!session,
      isAdmin,
      isEditor,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
  }, [loading, session, isAdmin, isEditor, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
