import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

interface CountResponse {
  data: null;
  count: number | null;
  error: PostgrestError | null;
}

interface AbortableCountQuery {
  abortSignal: (signal: AbortSignal) => Promise<CountResponse>;
}

export interface AdminStats {
  pendingSubmissions: number;
  activePlacements: number;
  endingSoon: number;
  failedPayments: number;
}

export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async ({ signal }): Promise<AdminStats> => {
      try {
        const [
          pendingRes,
          activeRes,
          endingSoonRes,
          failedPaymentsRes
        ] = await Promise.all([
          (supabase.from("submissions").select("*", { count: 'exact', head: true }).eq('status', 'pending') as unknown as AbortableCountQuery).abortSignal(signal),
          (supabase.from("placements").select("*", { count: 'exact', head: true }).gt('end_date', new Date().toISOString()) as unknown as AbortableCountQuery).abortSignal(signal),
          (supabase.from("placements").select("*", { count: 'exact', head: true })
            .gt('end_date', new Date().toISOString())
            .lt('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) as unknown as AbortableCountQuery).abortSignal(signal),
          (supabase.from("payments").select("*", { count: 'exact', head: true }).eq('status', 'failed') as unknown as AbortableCountQuery).abortSignal(signal)
        ]);

        if (pendingRes.error) console.warn("Pending submissions fetch returned error:", pendingRes.error);
        if (activeRes.error) console.warn("Active placements fetch returned error:", activeRes.error);
        if (endingSoonRes.error) console.warn("Ending soon placements fetch returned error:", endingSoonRes.error);
        if (failedPaymentsRes.error) console.warn("Failed payments fetch returned error:", failedPaymentsRes.error);

        return {
          pendingSubmissions: pendingRes.count || 0,
          activePlacements: activeRes.count || 0,
          endingSoon: endingSoonRes.count || 0,
          failedPayments: failedPaymentsRes.count || 0
        };
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          throw err;
        }
        console.error("Error fetching dashboard stats:", err);
        throw err;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export interface ActivityLog {
  id: string;
  action_type: string;
  target_type: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export function useAdminActivities(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-dashboard-activities"],
    queryFn: async ({ signal }): Promise<ActivityLog[]> => {
      try {
        type ActivityResponse = {
          data: ActivityLog[] | null;
          error: PostgrestError | null;
        };

        type AbortableActivityQuery = {
          abortSignal: (signal: AbortSignal) => Promise<ActivityResponse>;
        };

        const { data, error } = await (supabase
          .from("admin_actions")
          .select(`
            id,
            action_type,
            target_type,
            created_at,
            profiles (full_name)
          `)
          .order("created_at", { ascending: false })
          .limit(5) as unknown as AbortableActivityQuery).abortSignal(signal);

        if (error) throw error;
        return data || [];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          throw err;
        }
        console.error("Error fetching admin activities:", err);
        throw err;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
