import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListMusic, AlertCircle, TrendingUp, Loader2, User, Zap, Percent, Clock, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminStats, useVisibilityMetrics } from "@/hooks/useAdminStats";

interface CommerceEvent {
  id: string;
  user_id: string | null;
  stripe_session_id: string | null;
  type: string;
  status: string;
  amount_total: number | null;
  currency: string | null;
  created_at: string;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { setIsAdminMode } = useAdmin();
  const [commerceEvents, setCommerceEvents] = useState<CommerceEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const { data: stats = {
    pendingReview: 0,
    unpaidSubmissions: 0,
    activePlacements: 0,
    endingSoon: 0,
    failedPayments: 0
  }, isLoading: isLoadingStats } = useAdminStats(true);

  // Use React Query for visibility metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useVisibilityMetrics(true);

  useEffect(() => {
    const fetchCommerceEvents = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('commerce_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        setCommerceEvents((data as unknown as CommerceEvent[]) || []);
      } catch (err) {
        console.error('Error fetching commerce events:', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchCommerceEvents();
    
    // Subscribe to new commerce events
    const channel = supabase
      .channel('commerce_events_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commerce_events' }, (payload) => {
        setCommerceEvents(prev => [payload.new as CommerceEvent, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loading = isLoadingStats || isLoadingMetrics;

  const formatAction = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'succeeded':
        return 'bg-dem/10 text-dem';
      case 'failed':
      case 'error':
        return 'bg-rep/10 text-rep';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
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
        {/* Commerce Health Panel */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-black text-xl text-foreground">Commerce Health</CardTitle>
              <Activity className="w-4 h-4 text-dem" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-dem" />
                </div>
              ) : commerceEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Type</th>
                        <th className="pb-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                        <th className="pb-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Amount</th>
                        <th className="pb-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {commerceEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-3 font-bold text-foreground">{formatAction(event.type)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-foreground">
                            {event.amount_total ? `${(event.amount_total / 100).toFixed(2)} ${event.currency?.toUpperCase()}` : '-'}
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground font-black italic">No commerce events recorded.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
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

export default AdminDashboard;