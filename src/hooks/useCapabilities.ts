import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Capability } from "@/config/pricing";
import { filterActiveCapabilities } from "@/lib/capability-utils";

export function useCapabilities() {
  const { data: capabilities = [], isLoading, refetch } = useQuery({
    queryKey: ["user-capabilities"],
    queryFn: async ({ signal }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const query = supabase
          .from("user_capabilities")
          .select("capability, expires_at")
          .eq("user_id", user.id) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: unknown[] | null; error: unknown }> };

        const result = await query.abortSignal(signal);
        const data = result.data as { capability: string; expires_at: string | null }[];
        const error = result.error as { code: string; message: string } | null;

        if (error) {
          // Only log if it's not a "table not found" error which is common during initial setup/migration
          if (error.code !== 'PGRST205') {
            console.error("Error fetching capabilities:", error);
          }
          return [];
        }

        const dataWithActive = filterActiveCapabilities(data);
        return dataWithActive.map(cap => cap.capability as Capability);
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
  });

  const hasCapability = (capability: Capability) => {
    return capabilities.includes(capability);
  };

  return {
    capabilities,
    hasCapability,
    isLoading,
    refetch,
  };
}
