import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Entitlement } from "@/types/slots";
import { safeQuery } from "@/lib/supabase-debug";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useRef } from "react";

type EntitlementsFetchState =
  | "initializing"
  | "unauthenticated"
  | "loading"
  | "ready"
  | "error";

export function useEntitlements() {
  const { status: authStatus, user } = useAuth();
  const userId = user?.id ?? null;
  const enabled = authStatus === "authenticated" && !!userId;
  const previousStateRef = useRef<EntitlementsFetchState | null>(null);

  const { data: entitlements = [], isLoading, refetch, error } = useQuery({
    queryKey: ["user-entitlements", userId],
    enabled,
    queryFn: async ({ signal }) => {
      try {
        if (!userId) return [];
        console.log("%cENTITLEMENTS TRANSITION", "color: #22d3ee; font-weight: bold;", "fetch.start", { userId });

        const data = await safeQuery(
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
      } catch (err) {
        if (err instanceof Error && (err.name === "AbortError" || err.message?.includes("abort"))) {
          return [];
        }
        throw err;
      }
    },
    refetchOnWindowFocus: false,
  });

  const state: EntitlementsFetchState = useMemo(() => {
    if (authStatus === "initializing") return "initializing";
    if (authStatus !== "authenticated" || !userId) return "unauthenticated";
    if (isLoading) return "loading";
    if (error) return "error";
    return "ready";
  }, [authStatus, error, isLoading, userId]);

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
