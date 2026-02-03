import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentPlacement } from "@/types/cms";

/**
 * Fetches the active placement for a given slot key.
 * Resolves by priority, device scope, and time window.
 */
export function useSlotContent(slotKey: string) {
  return useQuery({
    queryKey: ["slot-content", slotKey],
    queryFn: async () => {
      const now = new Date().toISOString();
      const query = (supabase as any)
        .from("content_placements")
        .select("*")
        .eq("slot_key", slotKey)
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("priority", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error(`Error resolving slot ${slotKey}:`, error);
        return null;
      }

      // Filter by device scope in JS to keep the DB query simple
      const isMobile = window.innerWidth < 768; // Simple check for resolution
      const filtered = (data as any[] | null)?.filter(p => 
        p.device_scope === 'all' || 
        (isMobile ? p.device_scope === 'mobile' : p.device_scope === 'desktop')
      ) as ContentPlacement[] ?? [];

      return filtered[0] || null;
    },
    staleTime: 1000 * 30, // Shorter stale time for temporal changes
  });
}
export function useSlotContents(slotKey: string) {
  return useQuery({
    queryKey: ["slot-contents", slotKey],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const query = (supabase as any)
        .from("content_placements")
        .select("*")
        .eq("slot_key", slotKey)
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("priority", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error(`Error resolving multi-slot ${slotKey}:`, error);
        return [];
      }

      const isMobile = window.innerWidth < 768;
      const filtered = (data as any[] | null)?.filter(p => 
        p.device_scope === 'all' || 
        (isMobile ? p.device_scope === 'mobile' : p.device_scope === 'desktop')
      ) as ContentPlacement[] ?? [];

      return filtered;
    },
    staleTime: 1000 * 30,
  });
}
