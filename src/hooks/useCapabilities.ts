import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Capability } from "@/config/pricing";
import { filterActiveCapabilities } from "@/lib/capability-utils";

export function useCapabilities() {
  const { data: capabilities = [], isLoading, refetch } = useQuery({
    queryKey: ["user-capabilities"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_capabilities")
        .select("capability, expires_at")
        .eq("user_id", user.id);

      if (error) {
        // Only log if it's not a "table not found" error which is common during initial setup/migration
        if (error.code !== 'PGRST205') {
          console.error("Error fetching capabilities:", error);
        }
        return [];
      }

      const dataWithActive = filterActiveCapabilities(data);
      return dataWithActive.map(cap => cap.capability as Capability);
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
