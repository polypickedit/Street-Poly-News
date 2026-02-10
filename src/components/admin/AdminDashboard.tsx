import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListMusic, History, AlertCircle, TrendingUp, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { Zap } from "lucide-react";

interface ActivityLog {
  id: string;
  action_type: string;
  target_type: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { setIsAdminMode } = useAdmin();

  // Use React Query for stats to handle lifecycle and aborts automatically
  const { data: stats = {
    pendingSubmissions: 0,
    activePlacements: 0,
    endingSoon: 0,
    failedPayments: 0
  }, isLoading: isLoadingStats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async ({ signal }) => {
      console.log("AdminDashboard: Fetching stats...");
      try {
        interface CountResponse {
          count: number | null;
          error: { message: string; code: string } | null;
        }

        const queryWrapper = (q: unknown) => (q as { abortSignal: (s: AbortSignal) => Promise<CountResponse> });

        const [
          pendingRes,
          activeRes,
          endingSoonRes,
          failedPaymentsRes
        ] = await Promise.all([
          queryWrapper(supabase.from("submissions").select("*", { count: 'exact', head: true }).eq('status', 'pending')).abortSignal(signal),
          queryWrapper(supabase.from("placements").select("*", { count: 'exact', head: true }).gt('end_date', new Date().toISOString())).abortSignal(signal),
          queryWrapper(supabase.from("placements").select("*", { count: 'exact', head: true })
            .gt('end_date', new Date().toISOString())
            .lt('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())).abortSignal(signal),
          queryWrapper(supabase.from("payments").select("*", { count: 'exact', head: true }).eq('status', 'failed')).abortSignal(signal)
        ]);

        // Check for individual errors but don't throw unless it's a critical connection failure
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
        // Handle abort error silently
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          console.log("AdminDashboard: Stats fetch aborted");
          return {
            pendingSubmissions: 0,
            activePlacements: 0,
            endingSoon: 0,
            failedPayments: 0
          };
        }
        console.error("Error fetching dashboard stats:", err);
        throw err;
      }
    },
    staleTime: 30000,
    retry: 1,
  });

  // Use React Query for activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["admin-dashboard-activities"],
    queryFn: async ({ signal }) => {
      try {
        const query = supabase
          .from("admin_actions")
          .select(`
            id,
            action_type,
            target_type,
            created_at,
            profiles:admin_user_id (full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5) as unknown as { abortSignal: (s: AbortSignal) => Promise<{ data: ActivityLog[] | null; error: { message: string; code: string } | null }> };

        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;
        return data || [];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
  });

  const loading = isLoadingStats || isLoadingActivities;

  const formatAction = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-dem" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-foreground">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Pending Submissions</CardTitle>
            <ListMusic className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-dem">{stats.pendingSubmissions}</div>
            <p className="text-sm text-muted-foreground mt-1 font-bold">Requires review</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Active Placements</CardTitle>
            <Zap className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-dem">{stats.activePlacements}</div>
            <p className="text-sm text-muted-foreground mt-1 font-bold">Currently live</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Ending Soon</CardTitle>
            <History className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-dem">{stats.endingSoon}</div>
            <p className="text-sm text-muted-foreground mt-1 font-bold">Expires in 7 days</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Failed Payments</CardTitle>
            <AlertCircle className="w-4 h-4 text-rep" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rep">{stats.failedPayments}</div>
            <p className="text-sm text-muted-foreground mt-1 font-bold">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-black text-xl text-foreground">Recent Admin Activity</CardTitle>
              <History className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                    <div className="mt-1 bg-muted p-2 rounded-full">
                      <TrendingUp className="w-4 h-4 text-dem" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">
                          {formatAction(activity.action_type)}
                        </p>
                        <span className="text-sm text-muted-foreground font-black uppercase tracking-widest">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-bold mt-0.5">
                        {activity.profiles?.full_name || 'System Admin'} modified {activity.target_type}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground font-black italic">No recent activity recorded.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-black text-xl text-foreground">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              type="button"
              onClick={() => navigate('/admin/submissions')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-dem/10 hover:border-dem/30 border border-border transition-all group"
            >
              <div className="flex items-center gap-3">
                <ListMusic className="w-4 h-4 text-dem" />
                <span className="text-sm font-black text-foreground group-hover:text-dem transition-colors">Review Submissions</span>
              </div>
              <TrendingUp className="w-3 h-3 text-muted-foreground group-hover:text-dem transition-colors" />
            </button>
            <button 
              type="button"
              onClick={() => navigate('/admin/placements')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-dem/10 hover:border-dem/30 border border-border transition-all group"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-dem" />
                <span className="text-sm font-black text-foreground group-hover:text-dem transition-colors">Manage Placements</span>
              </div>
              <TrendingUp className="w-3 h-3 text-muted-foreground group-hover:text-dem transition-colors" />
            </button>
            <button 
              type="button"
              onClick={() => setIsAdminMode(false)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-rep/10 hover:border-rep/30 border border-border transition-all group"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-rep" />
                <span className="text-sm font-black text-foreground group-hover:text-rep transition-colors">Exit Admin View</span>
              </div>
              <TrendingUp className="w-3 h-3 text-muted-foreground group-hover:text-rep transition-colors" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};