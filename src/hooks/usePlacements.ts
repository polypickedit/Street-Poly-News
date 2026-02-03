import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentPlacement } from "@/types/cms";

/**
 * Fetches the active placement for a given slot key.
 * Resolves by priority and time window (controlled by RLS).
 */
export function useSlotContent(slotKey: string) {
  return useQuery({
    queryKey: ["slot-content", slotKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_placements")
        .select("*")
        .eq("slot_key", slotKey)
        .eq("active", true)
        .order("priority", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`Error resolving slot ${slotKey}:`, error);
        return null;
      }

      return data as ContentPlacement | null;
    },
    // Keep data fresh but don't over-query unless focused
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
/**
 * Fetches all active placements for a given slot key.
 * Useful for collections (trending, breaking news, etc).
 */
export function useSlotContents(slotKey: string) {
  return useQuery({
    queryKey: ["slot-contents", slotKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_placements")
        .select("*")
        .eq("slot_key", slotKey)
        .eq("active", true)
        .order("priority", { ascending: false });

      if (error) {
        console.error(`Error resolving multi-slot ${slotKey}:`, error);
        return [];
      }

      return data as ContentPlacement[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
