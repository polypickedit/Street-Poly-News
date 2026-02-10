
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Music, 
  CreditCard, 
  Layout, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  User as UserIcon,
  Share2,
  Globe,
  Loader2,
  Zap,
  Plus
} from "lucide-react";
import { useAccount } from "../hooks/useAccount";
import { useCapabilities } from "../hooks/useCapabilities";
import { useAuth } from "../hooks/useAuth";
import { useAdminStats, useAdminActivities } from "../hooks/useAdminStats";
import { createCreditPackCheckoutSession } from "../lib/stripe";
import { useToast } from "../hooks/use-toast";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface DistributionStatus {
  id: string;
  status: 'pending' | 'published' | 'rejected' | 'scheduled';
  published_url: string | null;
  media_outlets: {
    name: string;
  };
}

interface Submission {
  id: string;
  track_title: string;
  artist_name: string;
  status: 'pending' | 'approved' | 'declined';
  payment_status: 'paid' | 'unpaid';
  created_at: string;
  slots?: {
    name: string;
    price: number;
    display_category: string;
  };
  submission_distribution?: DistributionStatus[];
}

import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  // Decouple these from the first paint
  const accountQuery = useAccount();
  const capabilityQuery = useCapabilities();
  
  const activeAccount = accountQuery.activeAccount;
  const isLoadingAccount = accountQuery.isLoading;
  const capabilities = capabilityQuery.capabilities;
  const isLoadingCapabilities = capabilityQuery.isLoading;
  
  // Keep admin stats and activities alive at the dashboard level to prevent aborts on tab switch
  useAdminStats(isAdmin);
  useAdminActivities(isAdmin);
  
  // Debug logs to identify loading hang
  useEffect(() => {
    console.log("Dashboard Loading State:", {
      authLoading,
      isLoadingAccount,
      isLoadingCapabilities,
      hasUser: !!user,
      activeAccount: !!activeAccount,
      timestamp: new Date().toISOString()
    });
  }, [authLoading, isLoadingAccount, isLoadingCapabilities, user, activeAccount]);

  const submissionsQuery = useQuery({
    queryKey: ["user-submissions"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const { data, error } = await supabase
          .from("submissions")
          .select(`
            id,
            track_title,
            artist_name,
            status,
            payment_status,
            created_at,
            slots (
              name,
              price,
              display_category
            ),
            submission_distribution (
              id,
              status,
              published_url,
              media_outlets (
                name
              )
            )
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching submissions:", err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30000, // Submissions can change more frequently
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const submissions = submissionsQuery.data || [];
  const loadingSubmissions = submissionsQuery.isLoading;
  const refetchSubmissions = submissionsQuery.refetch;

  // Real-time subscription for submissions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Real-time update: refetching submissions');
          refetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchSubmissions]);

  const placementsQuery = useQuery({
    queryKey: ["user-placements"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const { data, error } = await supabase
          .from("placements")
          .select(`
            id,
            start_date,
            end_date,
            playlists (
              name,
              spotify_playlist_url
            ),
            submissions!inner (
              track_title,
              artist_name,
              user_id
            )
          `)
          .eq("submissions.user_id", session.user.id)
          .order("start_date", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching placements:", err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const placements = placementsQuery.data || [];
  const loadingPlacements = placementsQuery.isLoading;

  const paymentsQuery = useQuery({
    queryKey: ["user-payments"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching payments:", err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const payments = paymentsQuery.data || [];
  const loadingPayments = paymentsQuery.isLoading;

  // Diagnostic log after all data hooks
  console.log("[Dashboard] render", { 
    authLoading, 
    hasUser: !!user,
    isLoadingAccount,
    isLoadingCapabilities,
    submissionsLength: submissions?.length,
    placementsLength: placements?.length,
    timestamp: new Date().toISOString()
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-dem/20 text-dem border-dem/40 font-black">Approved</Badge>;
      case "published": return <Badge className="bg-dem/20 text-dem border-dem/40 font-black">Published</Badge>;
      case "scheduled": return <Badge className="bg-muted text-foreground border-border font-black">Scheduled</Badge>;
      case "declined": 
      case "rejected": return <Badge className="bg-rep/20 text-rep border-rep/40 font-black">Declined</Badge>;
      case "pending": return <Badge className="bg-muted text-foreground border-border font-black">Pending</Badge>;
      default: return <Badge variant="outline" className="border-border text-foreground font-black">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-dem/20 text-dem border-dem/40 font-black">Paid</Badge>;
      case "unpaid": return <Badge className="bg-rep/20 text-rep border-rep/40 font-black">Unpaid</Badge>;
      default: return <Badge variant="outline" className="border-border text-foreground font-black">{status}</Badge>;
    }
  };

  return (
    <PageLayoutWithAds showAds={false} mainClassName="max-w-7xl mx-auto">
      <PageTransition>
        <div className="max-w-7xl mx-auto py-8 text-foreground">
          {authLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-dem mb-4" />
              <p className="text-dem animate-pulse font-black">Checking authentication...</p>
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="h-8 w-8 text-rep mb-4" />
              <p className="text-foreground font-medium">Please sign in to view your dashboard.</p>
              <Button 
                variant="outline" 
                className="mt-4 border-border hover:bg-muted text-foreground font-bold uppercase tracking-wider"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </div>
          ) : (
            <>
              <header className="mb-12">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 mb-4"
                >
                  <div className="w-12 h-12 rounded-full bg-dem/20 flex items-center justify-center border border-dem/40">
                    <UserIcon className="w-6 h-6 text-dem" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-dem">My Dashboard</h1>
                    <p className="text-dem font-black text-lg">{user.email}</p>
                  </div>
                </motion.div>
              </header>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <Card className="bg-card border-border text-foreground shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Available Features</CardTitle>
                <Zap className="w-4 h-4 text-dem" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-dem">
                  {isLoadingCapabilities ? (
                    <Loader2 className="w-6 h-6 animate-spin text-dem/70" />
                  ) : (
                    capabilities.length
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 font-black">Services you can use</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border text-foreground shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Active Account</CardTitle>
                <UserIcon className="w-4 h-4 text-dem" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-black text-dem truncate">
                  {isLoadingAccount ? "Loading..." : activeAccount?.name || "No Account"}
                </div>
                <Badge variant="outline" className="mt-2 text-xs uppercase tracking-wider border-dem/60 bg-dem/20 text-dem font-black">
                  {activeAccount?.type || "Individual"}
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-foreground shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Quick Actions</CardTitle>
                <Plus className="w-4 h-4 text-dem" />
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs font-black uppercase tracking-widest h-9 border-dem/40 bg-dem/10 hover:bg-dem/20 text-dem hover:text-foreground"
                  onClick={() => navigate("/booking")}
                >
                  New Submission
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card border-border text-foreground shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Total Submissions</CardDescription>
                <CardTitle className="text-4xl font-black text-dem mt-1">{submissions?.length || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-black">
                  <Music className="w-4 h-4 text-dem" />
                  <span>History of all music submitted</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-foreground shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Active Placements</CardDescription>
                <CardTitle className="text-4xl font-black text-dem mt-1">{placements?.length || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-black">
                  <Layout className="w-4 h-4 text-dem" />
                  <span>Live on playlists or site</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-foreground shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Pending Review</CardDescription>
                <CardTitle className="text-4xl font-black text-dem mt-1">
                  {submissions?.filter((s) => s.status === 'pending').length || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-black">
                  <Clock className="w-4 h-4 text-rep" />
                  <span>Currently with our editors</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="submissions" className="space-y-8">
            <TabsList className="bg-muted border border-border p-1">
              <TabsTrigger value="submissions" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground font-black">Submissions</TabsTrigger>
              <TabsTrigger value="placements" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground font-black">Placements</TabsTrigger>
              <TabsTrigger value="capabilities" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground font-black">Features</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground font-black">Payments</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="management" className="data-[state=active]:bg-rep/20 data-[state=active]:text-rep text-muted-foreground font-black">Management</TabsTrigger>
              )}
            </TabsList>

            {isAdmin && (
              <TabsContent value="management" className="space-y-4">
                <AdminDashboard />
              </TabsContent>
            )}

            <TabsContent value="submissions" className="space-y-4">
              {loadingSubmissions ? (
                <div className="py-12 text-center text-foreground font-black">Loading submissions...</div>
              ) : submissions?.length === 0 ? (
                <Card className="bg-muted/30 border border-dashed border-border py-12">
                  <div className="text-center">
                    <Music className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
                    <h3 className="text-xl font-black mb-2 text-foreground">No submissions yet</h3>
                    <p className="text-muted-foreground font-black text-lg mb-6">Start your first submission to get featured.</p>
                    <Button className="bg-dem hover:bg-dem/90 text-foreground font-black" onClick={() => navigate("/booking")}>Submit Music</Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions?.map((s) => (
                    <Card key={s.id} className="bg-card border-border text-foreground shadow-sm">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="font-black text-xl text-dem">{s.track_title}</CardTitle>
                            <p className="text-sm text-muted-foreground font-black">{s.artist_name} • {s.slots?.name}</p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <div className="flex flex-col items-end">
                              <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Status</div>
                              {getStatusBadge(s.status)}
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Payment</div>
                              {getPaymentBadge(s.payment_status)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {s.submission_distribution && s.submission_distribution.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 mb-4 text-foreground">
                              <Share2 className="w-4 h-4 text-dem" />
                              <span className="text-sm font-black uppercase tracking-wider">Distribution Status</span>
                            </div>
                            <div className="space-y-3">
                              {s.submission_distribution.map((dist) => (
                                <div key={dist.id} className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs font-bold text-foreground">{dist.media_outlets?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {getStatusBadge(dist.status)}
                                    {dist.published_url && (
                                      <a 
                                        href={dist.published_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-dem hover:text-dem/80"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-6 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(s.created_at), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[9px] border-dem/30 text-dem">
                              ID: {s.id.slice(0, 8)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="placements" className="space-y-4">
              {loadingPlacements ? (
                <div className="py-12 text-center text-foreground font-black">Loading placements...</div>
              ) : placements?.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-border rounded-2xl bg-muted/30">
                  <Layout className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
                  <h3 className="text-xl font-black mb-2 text-foreground">No active placements</h3>
                  <p className="text-muted-foreground font-black text-lg">Your music will appear here once approved and scheduled.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {placements?.map((p: any) => (
                    <Card key={p.id} className="bg-card border-border text-foreground shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded bg-dem/20 flex items-center justify-center border border-dem/40">
                              <CheckCircle2 className="w-5 h-5 text-dem" />
                            </div>
                            <div>
                              <h4 className="font-black text-lg text-dem">{p.submissions?.track_title}</h4>
                              <p className="text-sm text-muted-foreground font-black">on {p.playlists?.name}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-6 items-center">
                            <div className="text-sm text-foreground font-black">
                              <div className="text-xs text-muted-foreground mb-1 font-black uppercase tracking-wider">Duration</div>
                              {format(new Date(p.start_date), "MMM d")} - {format(new Date(p.end_date), "MMM d, yyyy")}
                            </div>
                            {p.playlists?.spotify_playlist_url && (
                              <Button variant="ghost" size="sm" asChild className="text-dem hover:text-dem/70 hover:bg-dem/10 font-black">
                                <a href={p.playlists.spotify_playlist_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Playlist
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border-border text-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-dem font-black">Account Access</CardTitle>
                    <CardDescription className="text-muted-foreground font-bold">Your active features and services</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingCapabilities ? (
                      <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-dem/40" /></div>
                    ) : capabilities.length === 0 ? (
                      <div className="py-8 text-center text-foreground font-bold bg-muted/30 rounded-lg border border-border">
                        No active features found.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {capabilities.map((cap, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                              <Zap className="w-4 h-4 text-dem" />
                              <span className="text-sm font-black text-foreground uppercase tracking-wider">{cap.replace('.', ' ')}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-dem/40 text-dem bg-dem/10 font-black">ACTIVE</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="pt-4">
                      <Button className="w-full bg-dem hover:bg-dem/90 text-foreground text-sm h-10 font-black uppercase tracking-widest" onClick={() => navigate("/booking")}>
                        Get Featured
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border text-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-dem font-black">How it works</CardTitle>
                    <CardDescription className="text-muted-foreground font-bold">Access to site features</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-foreground font-bold space-y-4">
                    <p>When you purchase a service or get featured, you unlock specific site features.</p>
                    <ul className="space-y-2 list-disc pl-4 text-muted-foreground">
                      <li>Each submission uses one active feature slot.</li>
                      <li>Features remain active as long as your service is running.</li>
                      <li>One payment can unlock multiple features.</li>
                    </ul>
                    <p className="pt-2 italic text-xs text-muted-foreground">Everything you need to manage your presence.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
               {loadingPayments ? (
                <div className="py-12 text-center text-foreground font-black">Loading payments...</div>
              ) : payments?.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-border rounded-2xl bg-muted/30">
                  <CreditCard className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
                  <h3 className="text-xl font-black mb-2 text-foreground">No payment history</h3>
                  <p className="text-muted-foreground font-black text-lg">Your transaction receipts will appear here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {payments?.map((pm: any) => (
                    <Card key={pm.id} className="bg-card border-border text-foreground shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border">
                              <CreditCard className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                              <h4 className="font-black text-lg text-foreground">${(pm.amount_cents / 100).toFixed(2)} {pm.currency.toUpperCase()}</h4>
                              <p className="text-sm text-muted-foreground font-black">{format(new Date(pm.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right mr-4">
                              <div className="text-xs text-muted-foreground font-black uppercase tracking-wider mb-1">Status</div>
                              <Badge className={pm.status === 'succeeded' ? 'bg-dem/20 text-dem border-dem/40 font-black' : 'bg-rep/20 text-rep border-rep/40 font-black'}>
                                {pm.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs font-mono text-muted-foreground font-black">
                              {pm.stripe_payment_intent_id}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
            </>
          )}
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
}
