import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListMusic, History, AlertCircle, TrendingUp, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatData {
  pendingSubmissions: number;
  activePlacements: number;
  endingSoon: number;
  failedPayments: number;
}

interface ActivityLog {
  id: string;
  action_type: string;
  target_type: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatData>({
    pendingSubmissions: 0,
    activePlacements: 0,
    endingSoon: 0,
    failedPayments: 0
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats in parallel
      const [
        pendingRes,
        activeRes,
        endingSoonRes,
        failedPaymentsRes
      ] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("submissions").select("*", { count: 'exact', head: true }).eq('status', 'pending'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("placements").select("*", { count: 'exact', head: true }).gt('end_date', new Date().toISOString()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("placements").select("*", { count: 'exact', head: true })
          .gt('end_date', new Date().toISOString())
          .lt('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("payments").select("*", { count: 'exact', head: true }).eq('status', 'failed')
      ]);

      setStats({
        pendingSubmissions: pendingRes.count || 0,
        activePlacements: activeRes.count || 0,
        endingSoon: endingSoonRes.count || 0,
        failedPayments: failedPaymentsRes.count || 0
      });

      // Fetch recent activity
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: activityData } = await (supabase as any)
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

      if (activityData) {
        setActivities(activityData);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Submissions</CardTitle>
            <ListMusic className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pendingSubmissions}</div>
            <p className="text-xs text-slate-500 mt-1">Requires review</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Active Placements</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activePlacements}</div>
            <p className="text-xs text-slate-500 mt-1">Live on playlists</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Ending in 7 Days</CardTitle>
            <History className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.endingSoon}</div>
            <p className="text-xs text-slate-500 mt-1">Action required soon</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">System Alerts</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.failedPayments}</div>
            <p className="text-xs text-slate-500 mt-1">Payment issues</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Feed */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Recent Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">No recent activity found.</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {activity.profiles?.full_name || "System"} 
                          <span className="text-slate-400 font-normal"> {formatAction(activity.action_type)}</span>
                        </p>
                        <p className="text-xs text-slate-500">
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
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                <ListMusic className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-xs font-medium text-white">Review Submissions</span>
              </button>
              <button type="button" className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                <span className="text-xs font-medium text-white">Manage Placements</span>
              </button>
              <button type="button" className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                <History className="w-6 h-6 text-yellow-400 mb-2" />
                <span className="text-xs font-medium text-white">View Audit Logs</span>
              </button>
              <button type="button" className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
                <span className="text-xs font-medium text-white">System Settings</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
