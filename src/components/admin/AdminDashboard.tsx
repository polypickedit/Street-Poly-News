import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListMusic, History, AlertCircle, TrendingUp, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminStats, useAdminActivities, useVisibilityMetrics } from "@/hooks/useAdminStats";
import { Zap, Percent, Clock } from "lucide-react";

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

  const { data: stats = {
    pendingReview: 0,
    unpaidSubmissions: 0,
    activePlacements: 0,
    endingSoon: 0,
    failedPayments: 0
  }, isLoading: isLoadingStats } = useAdminStats(true);

  // Use React Query for activities
  const { data: activities = [], isLoading: isLoadingActivities } = useAdminActivities(true);

  // Use React Query for visibility metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useVisibilityMetrics(true);

  const loading = isLoadingStats || isLoadingActivities || isLoadingMetrics;

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
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Pending Review</CardTitle>
            <ListMusic className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-dem">{stats.pendingReview}</div>
            <p className="text-sm text-muted-foreground mt-1 font-bold">In review queue</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Unpaid</CardTitle>
            <AlertCircle className="w-4 h-4 text-rep" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rep">{stats.unpaidSubmissions}</div>
            <p className="text-sm text-muted-foreground mt-1 font-bold">Waiting for payment</p>
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
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Conversion Rate</CardTitle>
            <Percent className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-dem">{metrics?.conversionRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1 font-bold">Paid conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Visibility & Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Avg. Review Lag Time</CardTitle>
            <Clock className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-dem">{metrics?.avgLagTimeHours.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground mt-1 font-bold">Paid to Decision</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">System Health</CardTitle>
            <TrendingUp className="w-4 h-4 text-dem" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <div className="text-xl font-black text-dem">{stats.activePlacements}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-black">Live</p>
              </div>
              <div>
                <div className="text-xl font-black text-rep">{stats.failedPayments}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-black">Failures</p>
              </div>
              <div>
                <div className="text-xl font-black text-foreground">{stats.endingSoon}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-black">Expiring</p>
              </div>
            </div>
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