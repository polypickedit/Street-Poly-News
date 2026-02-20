import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Entitlement } from "@/types/slots";
import { safeFetch } from "@/lib/safeFetch";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useRef } from "react";

type EntitlementsFetchState =
  | "initializing"
  | "unauthenticated"
  | "loading"
  | "ready"
  | "error";

export function useEntitlements() {
  const { status: authStatus, user, appReady } = useAuth();
  const userId = user?.id ?? null;
  const enabled = appReady && authStatus === "authenticated" && !!userId;
  const previousStateRef = useRef<EntitlementsFetchState | null>(null);

  const { data: entitlements = [], isLoading, refetch, error } = useQuery({
    queryKey: ["user-entitlements", userId],
    enabled,
    queryFn: async ({ signal }) => {
      if (!userId) return [];
      console.log("%cENTITLEMENTS TRANSITION", "color: #22d3ee; font-weight: bold;", "fetch.start", { userId });

      // safeFetch handles AbortError internally
      const data = await safeFetch(
        supabase
        .from("slot_entitlements")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .abortSignal(signal)
      );

      const rows = (data || []) as Entitlement[];
      console.log("%cENTITLEMENTS TRANSITION", "color: #22d3ee; font-weight: bold;", "fetch.loaded", {
        userId,
        count: rows.length,
      });
      return rows;
    },
    refetchOnWindowFocus: false,
  });

  const state: EntitlementsFetchState = useMemo(() => {
    if (authStatus === "initializing" || (authStatus === "authenticated" && !appReady)) return "initializing";
    if (authStatus !== "authenticated" || !userId) return "unauthenticated";
    if (isLoading) return "loading";
    if (error) return "error";
    return "ready";
  }, [appReady, authStatus, error, isLoading, userId]);

  useEffect(() => {
    if (previousStateRef.current === state) return;
    previousStateRef.current = state;
    console.log("%cENTITLEMENTS TRANSITION", "color: #22d3ee; font-weight: bold;", state, {
      userId,
      count: entitlements.length,
    });
  }, [entitlements.length, state, userId]);

  const hasEntitlement = (slotId: string) => entitlements.some(e => e.slot_id === slotId);
  const capabilities = entitlements.map(e => e.slot_id);

  return {
    entitlements,
    capabilities,
    hasEntitlement,
    isLoading: state === "loading" || state === "initializing",
    state,
    refetch,
  };
}
