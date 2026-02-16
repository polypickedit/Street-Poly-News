import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";
import { safeQuery, safeCountQuery } from "@/lib/supabase-debug";

interface CountResponse {
  data: null;
  count: number | null;
  error: PostgrestError | null;
}

interface AbortableCountQuery {
  abortSignal: (signal: AbortSignal) => Promise<CountResponse>;
}

export interface AdminStats {
  pendingReview: number;
  unpaidSubmissions: number;
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
          pendingCount,
          unpaidCount,
          activeCount,
          endingSoonCount,
          failedPaymentsCount
        ] = await Promise.all([
          safeCountQuery((supabase.from("submissions").select("*", { count: 'exact', head: true }).eq('status', 'pending_review') as unknown as AbortableCountQuery).abortSignal(signal)),
          safeCountQuery((supabase.from("submissions").select("*", { count: 'exact', head: true }).eq('status', 'unpaid') as unknown as AbortableCountQuery).abortSignal(signal)),
          safeCountQuery((supabase.from("content_placements").select("*", { count: 'exact', head: true }).gt('ends_at', new Date().toISOString()) as unknown as AbortableCountQuery).abortSignal(signal)),
          safeCountQuery((supabase.from("content_placements").select("*", { count: 'exact', head: true })
            .gt('ends_at', new Date().toISOString())
            .lt('ends_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) as unknown as AbortableCountQuery).abortSignal(signal)),
          safeCountQuery((supabase.from("payments").select("*", { count: 'exact', head: true }).eq('status', 'failed') as unknown as AbortableCountQuery).abortSignal(signal))
        ]);

        return {
          pendingReview: pendingCount || 0,
          unpaidSubmissions: unpaidCount || 0,
          activePlacements: activeCount || 0,
          endingSoon: endingSoonCount || 0,
          failedPayments: failedPaymentsCount || 0
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

export interface VisibilityMetrics {
  conversionRate: number;
  avgLagTimeHours: number;
  submissionsByStatus: Record<string, number>;
  revenueBySlot: Record<string, number>;
}

interface StatusHistory {
  submission_id: string;
  from_status: string;
  to_status: string;
  created_at: string;
}

export function useVisibilityMetrics(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-visibility-metrics"],
    queryFn: async ({ signal: _signal }): Promise<VisibilityMetrics> => {
      try {
        // 1. Get submissions by status
        const statusCounts = await safeQuery(
          supabase
          .from("submissions")
          .select("status")
          .abortSignal(_signal)
        );
        
        const counts: Record<string, number> = {};
        if (statusCounts) {
          statusCounts.forEach((s: { status: string }) => {
            counts[s.status] = (counts[s.status] || 0) + 1;
          });
        }

        // 2. Calculate conversion rate (paid vs unpaid)
        const total = (counts['paid'] || 0) + (counts['unpaid'] || 0) + (counts['pending_review'] || 0) + (counts['approved'] || 0) + (counts['declined'] || 0);
        const paid = total - (counts['unpaid'] || 0);
        const conversionRate = total > 0 ? (paid / total) * 100 : 0;

        const historyData = await safeQuery(
          supabase
          .from("submission_status_history" as "submissions")
          .select("submission_id, from_status, to_status, created_at")
          .order("created_at", { ascending: true })
          .abortSignal(_signal)
        );

        const history = (historyData || []) as unknown as StatusHistory[];
        const lagTimes: number[] = [];
        const paidEvents: Record<string, string> = {};

        history.forEach(event => {
          if (event.to_status === 'paid' || event.to_status === 'pending_review') {
            paidEvents[event.submission_id] = event.created_at;
          } else if ((event.to_status === 'approved' || event.to_status === 'declined') && paidEvents[event.submission_id]) {
            const start = new Date(paidEvents[event.submission_id]).getTime();
            const end = new Date(event.created_at).getTime();
            lagTimes.push((end - start) / (1000 * 60 * 60)); // hours
            delete paidEvents[event.submission_id];
          }
        });

        const avgLagTimeHours = lagTimes.length > 0 
          ? lagTimes.reduce((a, b) => a + b, 0) / lagTimes.length 
          : 0;

        // 3. Get revenue by slot
        const revenueData = await safeQuery(
          supabase
          .from("submissions")
          .select("slot_id, payments(amount_cents)")
          .eq("payment_status", "paid")
          .abortSignal(_signal)
        );

        interface RevenueRow {
          slot_id: string;
          payments: { amount_cents: number }[];
        }

        const revenueBySlot: Record<string, number> = {};
        (revenueData as unknown as RevenueRow[])?.forEach((sub) => {
          const total = sub.payments?.reduce((acc, p) => acc + (p.amount_cents || 0), 0) || 0;
          revenueBySlot[sub.slot_id] = (revenueBySlot[sub.slot_id] || 0) + (total / 100);
        });

        return {
          conversionRate,
          avgLagTimeHours,
          submissionsByStatus: counts,
          revenueBySlot
        };
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          throw err;
        }
        console.error("Error fetching visibility metrics:", err);
        throw err;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
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
        const data = await safeQuery(
          supabase
          .from("admin_actions")
          .select(`
            id,
            action_type,
            target_type,
            created_at,
            profiles!admin_user_id (full_name)
          `)
          .order("created_at", { ascending: false })
          .limit(5)
          .abortSignal(signal)
        );

        return (data || []) as unknown as ActivityLog[];
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
  });
}
