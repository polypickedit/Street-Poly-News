import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListMusic, History, AlertCircle, TrendingUp, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/providers/AdminProvider";
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
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [
        pendingRes,
        activeRes,
        endingSoonRes,
        failedPaymentsRes
      ] = await Promise.all([
        supabase.from("submissions").select("*", { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from("placements").select("*", { count: 'exact', head: true }).gt('end_date', new Date().toISOString()),
        supabase.from("placements").select("*", { count: 'exact', head: true })
          .gt('end_date', new Date().toISOString())
          .lt('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("payments").select("*", { count: 'exact', head: true }).eq('status', 'failed')
      ]);

      return {
        pendingSubmissions: pendingRes.count || 0,
        activePlacements: activeRes.count || 0,
        endingSoon: endingSoonRes.count || 0,
        failedPayments: failedPaymentsRes.count || 0
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Use React Query for activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["admin-dashboard-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select(`
          id,
          action_type,
          target_type,
          created_at,
          profiles:admin_user_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as ActivityLog[];
    },
    staleTime: 60000, // Cache for 1 minute
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
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-white/40">Pending Submissions</CardTitle>
            <ListMusic className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.pendingSubmissions}</div>
            <p className="text-xs text-white/40 mt-1 font-medium">Requires review</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active Placements</CardTitle>
            <TrendingUp className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activePlacements}</div>
            <p className="text-xs text-white/40 mt-1 font-medium">Live on playlists</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ending in 7 Days</CardTitle>
            <History className="w-4 h-4 text-rep" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.endingSoon}</div>
            <p className="text-xs text-white/40 mt-1 font-medium">Action required soon</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-white/40">System Alerts</CardTitle>
            <AlertCircle className="w-4 h-4 text-rep" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rep">{stats.failedPayments}</div>
            <p className="text-xs text-white/40 mt-1 font-medium">Payment issues</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Feed */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Recent Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-center text-white/40 py-8 text-sm">No recent activity found.</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {activity.profiles?.full_name || "System"} 
                          <span className="text-white/60 font-normal"> {formatAction(activity.action_type)}</span>
                        </p>
                        <p className="text-xs text-white/40">
                          {activity.target_type} • {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health / Quick Links */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                type="button" 
                onClick={() => {
                  setIsAdminMode(true);
                  navigate("/");
                }}
                className="col-span-1 sm:col-span-2 flex items-center justify-between p-4 rounded-lg bg-dem/10 hover:bg-dem/20 transition-all border border-dem/30 hover:shadow-[0_0_20px_rgba(20,184,166,0.2)] group"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-dem fill-current animate-pulse" />
                  <div className="text-left">
                    <span className="text-sm font-bold text-white block">Launch Control Room</span>
                    <span className="text-[10px] text-white/50 uppercase tracking-widest">Visual Layout Conductor</span>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-dem group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                type="button" 
                onClick={() => navigate("/admin/queue")}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/5 hover:bg-dem/20 transition-colors border border-white/10 hover:border-dem/30 group"
              >
                <ListMusic className="w-6 h-6 text-dem mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white">Review Submissions</span>
              </button>
              <button 
                type="button" 
                onClick={() => navigate("/admin/placements")}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/5 hover:bg-dem/20 transition-colors border border-white/10 hover:border-dem/30 group"
              >
                <TrendingUp className="w-6 h-6 text-dem mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white">Manage Placements</span>
              </button>
              <button 
                type="button" 
                onClick={() => navigate("/admin/submissions")}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/5 hover:bg-rep/20 transition-colors border border-white/10 hover:border-rep/30 group"
              >
                <History className="w-6 h-6 text-rep mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white">View Audit Logs</span>
              </button>
              <button 
                type="button" 
                onClick={() => navigate("/admin/settings")}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/5 hover:bg-rep/20 transition-colors border border-white/10 hover:border-rep/30 group"
              >
                <AlertCircle className="w-6 h-6 text-rep mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white">System Settings</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};