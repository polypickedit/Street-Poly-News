import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentPlacement } from "@/types/cms";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches the active placement for a given slot key.
 * Resolves by priority, device scope, and time window.
 */
export function useSlotContent(slotKey: string) {
  return useQuery({
    queryKey: ["slot-content", slotKey],
    queryFn: async ({ signal }) => {
      try {
        const now = new Date().toISOString();
        const query = (supabase as SupabaseClient)
          .from("content_placements")
          .select("*")
          .eq("slot_key", slotKey)
          .eq("active", true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gt.${now}`)
          .order("priority", { ascending: false })
          .abortSignal(signal);

        const { data, error } = await query;

        if (error) {
          // Only log if it's not a missing table error (PGRST205)
          // This prevents console spam when content_placements hasn't been migrated yet
          if (error.code !== 'PGRST205') {
            console.error(`Error resolving slot ${slotKey}:`, error);
          }
          return null;
        }

        // Filter by device scope in JS to keep the DB query simple
        const isMobile = window.innerWidth < 768; // Simple check for resolution
        const placements = (data || []) as ContentPlacement[];
        const filtered = placements.filter(p => 
          p.device_scope === 'all' || 
          (isMobile ? p.device_scope === 'mobile' : p.device_scope === 'desktop')
        );

        return filtered[0] || null;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 30, // Shorter stale time for temporal changes
  });
}
export function useSlotContents(slotKey: string) {
  return useQuery({
    queryKey: ["slot-contents", slotKey],
    queryFn: async ({ signal }) => {
      try {
        const now = new Date().toISOString();
        
        const query = (supabase as SupabaseClient)
          .from("content_placements")
          .select("*")
          .eq("slot_key", slotKey)
          .eq("active", true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gt.${now}`)
          .order("priority", { ascending: false })
          .abortSignal(signal);

        const { data, error } = await query;

        if (error) {
          // Only log if it's not a missing table error (PGRST205)
          if (error.code !== 'PGRST205') {
            console.error(`Error resolving multi-slot ${slotKey}:`, error);
          }
          return [];
        }

        const isMobile = window.innerWidth < 768;
        const placements = (data || []) as ContentPlacement[];
        const filtered = placements.filter(p => 
          p.device_scope === 'all' || 
          (isMobile ? p.device_scope === 'mobile' : p.device_scope === 'desktop')
        );

        return filtered;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
    staleTime: 1000 * 30,
  });
}
