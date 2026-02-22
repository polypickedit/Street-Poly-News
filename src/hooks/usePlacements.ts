import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentPlacement } from "@/types/cms";
import { safeQuery } from "@/lib/supabase-debug";
import { useAuth } from "@/hooks/useAuth";
import { ContentType } from "@/types/cms";

/**
 * Fetches the active placement for a given slot key.
 * Resolves by priority, device scope, and time window.
 */
export function useSlotContent(slotKey: string, accepts?: ContentType[]) {
  const { appReady } = useAuth();
  return useQuery({
    queryKey: ["slot-content", slotKey],
    queryFn: async ({ signal }) => {
      const now = new Date().toISOString();
      const placements = await safeQuery(
        supabase
          .from("content_placements")
          .select("*")
          .eq("slot_key", slotKey)
          .eq("active", true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gt.${now}`)
          .order("priority", { ascending: false })
          .abortSignal(signal)
      ) as ContentPlacement[] | null;

      if (!placements) return null;

      // Filter by device scope in JS to keep the DB query simple
      const isMobile = window.innerWidth < 768; // Simple check for resolution
      const filtered = placements.filter(p => 
        p.device_scope === 'all' || 
        (isMobile ? p.device_scope === 'mobile' : p.device_scope === 'desktop')
      );

      if (!accepts || accepts.length === 0) {
        return filtered[0] || null;
      }

      const acceptedPlacement = filtered.find((p) =>
        accepts.includes(p.content_type as ContentType)
      );

      return acceptedPlacement || null;
    },
    enabled: appReady && !!slotKey,
    staleTime: 1000 * 30, // Shorter stale time for temporal changes
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useSlotContents(slotKey: string) {
  const { appReady } = useAuth();
  return useQuery({
    queryKey: ["slot-contents", slotKey],
    queryFn: async ({ signal }) => {
      const now = new Date().toISOString();
      
      const placements = await safeQuery(
        supabase
          .from("content_placements")
          .select("*")
          .eq("slot_key", slotKey)
          .eq("active", true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gt.${now}`)
          .order("priority", { ascending: false })
          .abortSignal(signal)
      ) as ContentPlacement[] | null;

      if (!placements) return [];

      const isMobile = window.innerWidth < 768;
      const filtered = placements.filter(p => 
        p.device_scope === 'all' || 
        (isMobile ? p.device_scope === 'mobile' : p.device_scope === 'desktop')
      );

      return filtered;
    },
    enabled: appReady && !!slotKey,
    staleTime: 1000 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
