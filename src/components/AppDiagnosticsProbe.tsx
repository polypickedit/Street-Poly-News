import { useEffect, useMemo, useRef } from "react";
import { useIsFetching, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type ActiveQuerySnapshot = {
  key: string;
  startedAt: string;
  durationMs: number;
};

type AppDiagnosticsSnapshot = {
  path: string;
  search: string;
  hash: string;
  online: boolean;
  visibility: DocumentVisibilityState;
  focused: boolean;
  isFetching: number;
  isMutating: number;
  activeQueries: ActiveQuerySnapshot[];
  auth: {
    status: string;
    rolesLoaded: boolean;
    userId: string | null;
    isAdmin: boolean;
    isEditor: boolean;
    traceId: string | null;
    error: string | null;
  };
  timestamp: string;
};

type AppDiagnosticsApi = {
  getSnapshot: () => AppDiagnosticsSnapshot;
};

declare global {
  interface Window {
    __APP_DIAGNOSTICS__?: AppDiagnosticsApi;
  }
}

export function AppDiagnosticsProbe() {
  const location = useLocation();
  const auth = useAuth();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const queryClient = useQueryClient();
  const queryStartsRef = useRef<Map<string, number>>(new Map());

  const baseSnapshot = useMemo(
    () => ({
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      online: navigator.onLine,
      visibility: document.visibilityState,
      focused: document.hasFocus(),
      isFetching,
      isMutating,
      auth: {
        status: auth.status,
        rolesLoaded: auth.rolesLoaded,
        userId: auth.user?.id ?? null,
        isAdmin: auth.isAdmin,
        isEditor: auth.isEditor,
        traceId: auth.traceId,
        error: auth.error ?? null,
      },
    }),
    [
      location.pathname,
      location.search,
      location.hash,
      isFetching,
      isMutating,
      auth.status,
      auth.rolesLoaded,
      auth.user?.id,
      auth.isAdmin,
      auth.isEditor,
      auth.traceId,
      auth.error,
    ]
  );

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const now = Date.now();
      queryClient
        .getQueryCache()
        .findAll()
        .forEach((query) => {
          const key = JSON.stringify(query.queryKey);
          if (query.state.fetchStatus === "fetching") {
            if (!queryStartsRef.current.has(key)) {
              queryStartsRef.current.set(key, now);
            }
          } else {
            queryStartsRef.current.delete(key);
          }
        });

      // Optional local diagnostics monitor:
      // Enable by running in console: localStorage.setItem("rq-debug", "1")
      if (import.meta.env.DEV && localStorage.getItem("rq-debug") === "1") {
        const q = event?.query;
        if (q) {
          // Keep logs concise and keyed so transition churn is visible.
          console.debug("[RQ]", {
            type: event?.type,
            key: JSON.stringify(q.queryKey),
            fetchStatus: q.state.fetchStatus,
            status: q.state.status,
            updatedAt: q.state.dataUpdatedAt,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const getSnapshot = (): AppDiagnosticsSnapshot => {
      const now = Date.now();
      const activeQueries = Array.from(queryStartsRef.current.entries()).map(([key, startedMs]) => ({
        key,
        startedAt: new Date(startedMs).toISOString(),
        durationMs: Math.max(0, now - startedMs),
      }));

      return {
        ...baseSnapshot,
        activeQueries,
        timestamp: new Date().toISOString(),
      };
    };

    window.__APP_DIAGNOSTICS__ = { getSnapshot };

    return () => {
      delete window.__APP_DIAGNOSTICS__;
    };
  }, [baseSnapshot]);

  return null;
}
