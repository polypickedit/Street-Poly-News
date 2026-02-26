import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextInternal';
import { AuthState, initialAuthState } from './authTypes';
import { fetchSession } from '@/services/authService';
import { hydrateRoles } from '@/services/roleService';
import { generateTraceId } from '@/utils/trace';

export type AuthStatusEvent =
  | 'bootstrap.start'
  | 'session.authenticated'
  | 'session.unauthenticated'
  | 'session.error'
  | 'listener.authenticated'
  | 'listener.unauthenticated'
  | 'roles.hydrating'
  | 'roles.loaded'
  | 'roles.failed';

const OAUTH_CALLBACK_PARAM_KEYS = ['code', 'access_token', 'refresh_token', 'type'];
const OAUTH_MAX_ATTEMPTS = 30; // Increased from 15
const OAUTH_TIMEOUT_MS = 30000; // Increased from 15s to 30s
const SESSION_FETCH_TIMEOUT_MS = 10000; // Increased from 4s

const isOAuthCallbackReturn = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return OAUTH_CALLBACK_PARAM_KEYS.some((key) => params.has(key));
};

const logTransition = (event: AuthStatusEvent, next: AuthState) => {
  if (import.meta.env.DEV) {
    console.log('%cAUTH TRANSITION', 'color: violet; font-weight: bold;', event, {
      status: next.status,
      userId: next.user?.id ?? null,
      traceId: next.traceId,
    });
    console.log('AUTH STATE →', next);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialAuthState);
  const hydratedUserRef = useRef<string | null>(null);
  const hydrationRunIdRef = useRef(0);
  const bootstrappedRef = useRef(false);

  const transition = useCallback((event: AuthStatusEvent, update: Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>)) => {
    setState((prev) => {
      const partial = typeof update === 'function' ? update(prev) : update;
      const next: AuthState = {
        ...prev,
        ...partial,
        traceId: partial.traceId ?? prev.traceId,
      };
      logTransition(event, next);
      return next;
    });
  }, []);

  const hydrateRolesInBackground = useCallback(
    (userId: string, traceId?: string) => {
      if (hydratedUserRef.current === userId) {
        return;
      }

      const runId = ++hydrationRunIdRef.current;
      const trace = traceId ?? generateTraceId();
      transition('roles.hydrating', (prev) => ({
        // Only reset rolesLoaded if we are switching users.
        // If refreshing the same user, keep the previous state to avoid UI jitter.
        rolesLoaded: prev.user?.id === userId ? prev.rolesLoaded : false,
        // Keep previous role flags during hydration to avoid admin UI flicker.
        error: undefined,
        traceId: trace,
      }));

      hydrateRoles(userId)
        .then((result) => {
          if (runId !== hydrationRunIdRef.current) {
            return;
          }

          if (!result.ok) {
            const error = (result as { error: Error }).error;
            transition('roles.failed', {
              rolesLoaded: true,
              // Preserve previous role flags on transient role hydration failure.
              error: error.message,
              traceId: result.traceId,
            });
            return;
          }

          const success = result as { ok: true; isAdmin: boolean; isEditor: boolean; traceId: string };
          hydratedUserRef.current = userId;
          transition('roles.loaded', {
            rolesLoaded: true,
            isAdmin: success.isAdmin,
            isEditor: success.isEditor,
            error: undefined,
            traceId: success.traceId,
          });
        })
        .catch((error) => {
          if (runId !== hydrationRunIdRef.current) {
            return;
          }

          const errMessage = error instanceof Error ? error.message : String(error);
          console.error('Role hydration failed', error);
          transition('roles.failed', {
            rolesLoaded: true,
            // Preserve previous role flags on transient role hydration failure.
            error: errMessage,
            traceId: generateTraceId(),
          });
        });
    },
    [transition]
  );

  const hydrateForSession = useCallback(
    (session: Session, traceId?: string, event: AuthStatusEvent = 'session.authenticated') => {
      const trace = traceId ?? generateTraceId();
      transition(event, (prev) => ({
        status: 'authenticated',
        session,
        user: session.user,
        // Only reset rolesLoaded if we are switching users.
        rolesLoaded: prev.user?.id === session.user.id ? prev.rolesLoaded : false,
        isAdmin: false,
        isEditor: false,
        error: undefined,
        traceId: trace,
      }));
      if (session.user?.id) {
        hydrateRolesInBackground(session.user.id, trace);
      }
    },
    [hydrateRolesInBackground, transition]
  );

  const markUnauthenticated = useCallback(
    (traceId?: string, event: AuthStatusEvent = 'session.unauthenticated') => {
      hydratedUserRef.current = null;
      transition(event, {
        status: 'unauthenticated',
        session: null,
        user: null,
        rolesLoaded: false,
        isAdmin: false,
        isEditor: false,
        error: undefined,
        traceId: traceId ?? generateTraceId(),
      });
    },
    [transition]
  );

  const bootstrap = useCallback(async () => {
    const traceId = generateTraceId();
    transition('bootstrap.start', {
      status: 'initializing',
      session: null,
      user: null,
      rolesLoaded: false,
      isAdmin: false,
      isEditor: false,
      error: undefined,
      traceId,
    });

    try {
      const oauthCallback = isOAuthCallbackReturn();
      // Increase attempts and timeout for OAuth callbacks to allow Supabase to exchange code
      const maxAttempts = oauthCallback ? OAUTH_MAX_ATTEMPTS : 1;
      const timeoutMs = oauthCallback ? OAUTH_TIMEOUT_MS : SESSION_FETCH_TIMEOUT_MS;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const result = await fetchSession({ timeoutMs });
        if (!result.ok) {
          if (oauthCallback && attempt < maxAttempts) {
            // Exponential backoff for retries: 250, 500, 750...
            const delay = Math.min(250 * attempt, 2000);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          const error = (result as { error: Error }).error;
          transition('session.error', {
            status: 'unauthenticated',
            session: null,
            user: null,
            rolesLoaded: false,
            isAdmin: false,
            isEditor: false,
            error: error.message,
            traceId: result.traceId,
          });
          return;
        }

        const session = result.response.data.session;
        if (session?.user) {
          hydrateForSession(session, result.traceId);
          return;
        }

        if (oauthCallback && attempt < maxAttempts) {
          // Session is null but we are in OAuth callback flow. 
          // Supabase might still be exchanging code. Wait and retry.
          const delay = Math.min(250 * attempt, 2000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        markUnauthenticated(result.traceId, 'session.unauthenticated');
        return;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      transition('session.error', {
        status: 'error',
        session: null,
        user: null,
        rolesLoaded: false,
        isAdmin: false,
        isEditor: false,
        error: err.message,
        traceId: generateTraceId(),
      });
    }
  }, [hydrateForSession, markUnauthenticated, transition]);

  const refreshAuth = useCallback(async () => {
    try {
      const result = await fetchSession({ timeoutMs: 4000 });
      if (!result.ok) {
        markUnauthenticated(result.traceId, 'session.unauthenticated');
        return;
      }

      const session = result.response.data.session;
      if (!session?.user) {
        markUnauthenticated(result.traceId, 'session.unauthenticated');
        return;
      }

      hydrateForSession(session, result.traceId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Auth: refresh failed', err);
      transition('session.error', {
        status: 'error',
        session: null,
        user: null,
        rolesLoaded: false,
        isAdmin: false,
        isEditor: false,
        error: err.message,
        traceId: generateTraceId(),
      });
    }
  }, [hydrateForSession, markUnauthenticated, transition]);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) {
        console.log("AUTH EVENT:", event, session);
        console.log('%cAUTH TRANSITION', 'color: violet; font-weight: bold;', event, {
          hasSession: !!session,
          userId: session?.user?.id ?? null,
        });
      }
      if (!session?.user) {
        markUnauthenticated(generateTraceId(), 'listener.unauthenticated');
        return;
      }

      // Fix for "admin status lost on refresh"
      // If the user ID matches the one we've already hydrated (or are hydrating),
      // we only want to update the session object, not reset the role state.
      if (hydratedUserRef.current === session.user.id) {
        transition('session.authenticated', {
          session,
          user: session.user,
          // Do NOT reset rolesLoaded, isAdmin, isEditor - preserve existing state
        });
        return;
      }

      hydrateForSession(session, generateTraceId(), 'listener.authenticated');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateForSession, markUnauthenticated, transition]);

  const contextValue = useMemo(
    () => {
      const authReady = state.status !== 'initializing';
      // Strict app readiness:
      // 1. Not initializing
      // 2. If authenticated, roles MUST be loaded
      // 3. If unauthenticated or error, we are ready (as guest)
      const appReady = 
        authReady && 
        (state.status !== 'authenticated' || state.rolesLoaded);

      return {
        status: state.status,
        session: state.session,
        user: state.user,
        rolesLoaded: state.rolesLoaded,
        isAdmin: state.isAdmin,
        isEditor: state.isEditor,
        error: state.error,
        traceId: state.traceId ?? null,
        loading: state.status === 'initializing',
        authReady,
        appReady,
        refreshAuth,
      };
    },
    [state, refreshAuth]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
