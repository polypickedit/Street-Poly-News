import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextInternal';
import { AuthState } from '@/types/auth';
import { fetchSession, AuthServiceResult } from '@/services/authService';
import { hydrateRoles, RoleHydrationResult } from '@/services/roleService';
import { generateTraceId } from '@/utils/trace';
import { DevAuthStateOverlay } from '@/components/dev/AuthStateOverlay';

const initialAuthState: AuthState = 'initializing';
const stateReadySet: AuthState[] = ['ready', 'unauthenticated', 'error'];
const stateLoadingSet: AuthState[] = ['initializing', 'hydratingRoles'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [authTraceId, setAuthTraceId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const prevStateRef = useRef<AuthState>(initialAuthState);
  const hydratedUserRef = useRef<string | null>(null);
  const sessionFetchPromiseRef = useRef<Promise<AuthServiceResult> | null>(null);
  const sessionFetchControllerRef = useRef<AbortController | null>(null);
  const roleHydrationControllerRef = useRef<AbortController | null>(null);
  
  // Single-Entry Bootstrap Refs
  const bootstrappedRef = useRef(false);
  const initializingRef = useRef(false);

  const setState = useCallback((nextState: AuthState, traceId: string | null, meta: Record<string, unknown> = {}) => {
    setAuthTraceId(traceId);
    setAuthState((current) => {
      if (current === nextState) return current;
      console.log('AUTH TRANSITION:', current, '→', nextState, { traceId, ...meta });
      prevStateRef.current = nextState;
      return nextState;
    });
    setLoading(stateLoadingSet.includes(nextState));
    setAuthReady(stateReadySet.includes(nextState));
  }, []);

  const resetRoles = useCallback(() => {
    setIsAdmin(false);
    setIsEditor(false);
  }, []);

  const handleUnauthenticated = useCallback(
    (traceId: string, reason: string) => {
      hydratedUserRef.current = null;
      setSession(null);
      setUser(null);
      setAuthError(null);
      resetRoles();
      setState('unauthenticated', traceId, { reason });
    },
    [resetRoles, setState]
  );

  const hydrateRolesForUser = useCallback(
    async (userId: string, traceId: string) => {
      if (hydratedUserRef.current === userId) {
        setState('ready', traceId, { userId, note: 'roles_cached' });
        return true;
      }

      roleHydrationControllerRef.current?.abort();
      const controller = new AbortController();
      roleHydrationControllerRef.current = controller;

      setAuthError(null);
      setState('hydratingRoles', traceId, { userId });

      const result = await hydrateRoles(userId, { signal: controller.signal });
      roleHydrationControllerRef.current = null;

      if (result.ok) {
        setIsAdmin(result.isAdmin);
        setIsEditor(result.isEditor);
        hydratedUserRef.current = userId;
        setState('ready', traceId, { userId, roles: { admin: result.isAdmin, editor: result.isEditor } });
        return true;
      }

      setAuthError(result.error);
      resetRoles();
      hydratedUserRef.current = null;
      setState('error', traceId, { userId, error: result.error.message });
      return false;
    },
    [resetRoles, setState]
  );

  const fetchSessionOnce = useCallback(async (): Promise<AuthServiceResult> => {
    if (sessionFetchPromiseRef.current) {
      return sessionFetchPromiseRef.current;
    }

    const controller = new AbortController();
    sessionFetchControllerRef.current = controller;

    const promise = (async () => {
      try {
        return await fetchSession({ signal: controller.signal });
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

  const handleSessionPayload = useCallback(
    async (incomingSession: Session | null, traceId?: string) => {
      const lifecycleId = traceId ?? generateTraceId();
      if (!incomingSession?.user?.id) {
        handleUnauthenticated(lifecycleId, 'session_missing');
        return;
      }

      setSession(incomingSession);
      setUser(incomingSession.user);
      setState('authenticated', lifecycleId, { userId: incomingSession.user.id });
      await hydrateRolesForUser(incomingSession.user.id, lifecycleId);
    },
    [handleUnauthenticated, hydrateRolesForUser, setState]
  );

  const initializeAuth = useCallback(async () => {
      const lifecycleId = generateTraceId();
      setAuthError(null);
      setState('initializing', lifecycleId, { source: 'bootstrap' });

      try {
        const result = await fetchSessionOnce();
        
        if (!result.ok) {
             console.warn('Auth: Session fetch failed', result.error);
             handleUnauthenticated(lifecycleId, 'session_fetch_failed');
             return;
        }

        await handleSessionPayload(result.response.data.session, lifecycleId);
      } catch (err) {
          console.error("Auth bootstrap failed:", err);
          handleUnauthenticated(lifecycleId, 'bootstrap_error');
      }
  }, [fetchSessionOnce, handleSessionPayload, handleUnauthenticated, setState]);

  const refreshAuth = useCallback(async () => {
    abortPendingSessionFetch();
    try {
      const result = await fetchSessionOnce();
      if (!result.ok) {
        throw result.error;
      }
      await handleSessionPayload(result.response.data.session, result.traceId);
    } catch (error) {
      console.error('Auth: Refresh error:', error);
    }
  }, [abortPendingSessionFetch, fetchSessionOnce, handleSessionPayload]);

  // Single-Entry Bootstrap Effect
  useEffect(() => {
    if (bootstrappedRef.current) {
        console.log("Auth: bootstrap skipped (already initialized)");
        return;
    }
    if (initializingRef.current) {
        console.log("Auth: bootstrap skipped (initialization in progress)");
        return;
    }

    bootstrappedRef.current = true;
    initializingRef.current = true;
    console.log("Auth: bootstrap starting (single-entry)");

    initializeAuth()
      .catch((err) => {
        console.error("Auth bootstrap failed:", err);
      })
      .finally(() => {
        initializingRef.current = false;
        console.log("Auth: bootstrap complete");
      });
  }, []); // strict []

  // Subscription Effect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth: State change event:', event);
        await handleSessionPayload(currentSession, generateTraceId());
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSessionPayload]);

  const value = useMemo(
    () => ({
      session,
      user,
      isAdmin,
      isEditor,
      loading,
      authReady,
      refreshAuth,
      authState,
      traceId: authTraceId,
      authError,
    }),
    [session, user, isAdmin, isEditor, loading, authReady, refreshAuth, authState, authTraceId, authError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isAdmin && (
        <DevAuthStateOverlay
            state={authState}
            traceId={authTraceId}
            userId={user?.id ?? null}
            loading={loading}
            isAdmin={isAdmin}
            isEditor={isEditor}
            error={authError?.message ?? null}
        />
      )}
    </AuthContext.Provider>
  );
};
