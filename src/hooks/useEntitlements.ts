import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Entitlement } from "@/types/slots";

export function useEntitlements() {
  const { data: entitlements = [], isLoading, refetch } = useQuery({
    queryKey: ["user-entitlements"],
    queryFn: async ({ signal }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
          .from("slot_entitlements")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .abortSignal(signal);

        if (error) throw error;
        return data as Entitlement[];
      } catch (err) {
        if (err instanceof Error && (err.name === "AbortError" || err.message?.includes("abort"))) {
          return [];
        }
        throw err;
      }
    },
  });

  const hasEntitlement = (slotId: string) => entitlements.some(e => e.slot_id === slotId);
  const capabilities = entitlements.map(e => e.slot_id);

  return {
    entitlements,
    capabilities,
    hasEntitlement,
    isLoading,
    refetch,
  };
}
