
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { 
  Music, 
  CreditCard, 
  Layout, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  Share2,
  Globe,
  Loader2,
  Zap,
  Plus,
  Coins
} from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { useCapabilities } from "@/hooks/useCapabilities";
import { createCreditPackCheckoutSession } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

interface CreditPack {
  id: string;
  name: string;
  description: string | null;
  credit_amount: number;
  price_cents: number;
}
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

interface Placement {
  id: string;
  start_date: string;
  end_date: string;
  playlists?: {
    name: string;
    spotify_playlist_url: string;
  };
  submissions?: {
    track_title: string;
    artist_name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  submission_id: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const { activeAccount, isLoading: isLoadingAccount } = useAccount();
  const { capabilities, isLoading: isLoadingCapabilities } = useCapabilities();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: hasAccess } = await supabase.rpc("is_admin_or_editor");
      setIsAdmin(!!hasAccess);
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/login");
      setUser(user);
    });
  }, [navigate]);

  const { data: creditPacks } = useQuery({
    queryKey: ["credit-packs"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("credit_packs")
        .select("*")
        .order("price_cents", { ascending: true });
      if (error) throw error;
      return data as CreditPack[];
    },
    enabled: !!user,
  });

  const handlePurchaseCredits = async (packId: string) => {
    try {
      setIsPurchasing(packId);
      await createCreditPackCheckoutSession(packId);
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase failed",
        description: "Could not initialize checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(null);
    }
  };

  const { data: submissions, isLoading: loadingSubmissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ["user-submissions"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("submissions")
        .select(`
          *,
          artists(name),
          slots(name, price, display_category),
          submission_distribution(
            id,
            status,
            published_url,
            media_outlets(name)
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Submission[];
    },
    enabled: !!user,
  });

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

  const { data: placements, isLoading: loadingPlacements } = useQuery({
    queryKey: ["user-placements"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("placements")
        .select("*, playlists(name, spotify_playlist_url), submissions(track_title, artist_name, user_id)")
        .order("start_date", { ascending: false });

      if (error) throw error;
      
      // Since placements don't have user_id directly, we filter based on submission's user_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).filter(p => p.submissions?.user_id === session.user.id) as unknown as Placement[];
    },
    enabled: !!user,
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["user-payments"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("payments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Payment[];
    },
    enabled: !!user,
  });

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Approved</Badge>;
      case "published": return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Published</Badge>;
      case "scheduled": return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Scheduled</Badge>;
      case "declined": 
      case "rejected": return <Badge className="bg-red-500/10 text-red-400 border-red-500/30">Declined</Badge>;
      case "pending": return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Paid</Badge>;
      case "unpaid": return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">Unpaid</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <UserIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
              <p className="text-slate-400">{user.email}</p>
            </div>
          </motion.div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-400">Available Features</CardTitle>
              <Zap className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoadingCapabilities ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                ) : (
                  capabilities.length
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">Services you can use</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-400">Active Account</CardTitle>
              <UserIcon className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white truncate">
                {isLoadingAccount ? "Loading..." : activeAccount?.name || "No Account"}
              </div>
              <Badge variant="outline" className="mt-1 text-xs uppercase tracking-wider border-slate-700 text-slate-400">
                {activeAccount?.type || "Individual"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-400">Quick Actions</CardTitle>
              <Plus className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-sm h-9 border-slate-700 hover:bg-slate-800"
                onClick={() => navigate("/booking")}
              >
                New Submission
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 uppercase tracking-wider text-xs font-semibold">Total Submissions</CardDescription>
              <CardTitle className="text-3xl font-bold">{submissions?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Music className="w-4 h-4" />
                <span>Track reviews and features</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 uppercase tracking-wider text-xs font-semibold">Active Placements</CardDescription>
              <CardTitle className="text-3xl font-bold">{placements?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Layout className="w-4 h-4" />
                <span>Live on playlists or site</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 uppercase tracking-wider text-xs font-semibold">Pending Review</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {submissions?.filter((s: any) => s.status === 'pending').length || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Currently with our editors</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submissions" className="space-y-8">
          <TabsList className="bg-slate-900/80 border border-slate-800 p-1">
            <TabsTrigger value="submissions" className="data-[state=active]:bg-slate-800">Submissions</TabsTrigger>
            <TabsTrigger value="placements" className="data-[state=active]:bg-slate-800">Placements</TabsTrigger>
            <TabsTrigger value="capabilities" className="data-[state=active]:bg-slate-800">Features</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-slate-800">Payments</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="management" className="data-[state=active]:bg-rep/20 text-rep">Management</TabsTrigger>
            )}
          </TabsList>

          {isAdmin && (
            <TabsContent value="management" className="space-y-4">
              <AdminDashboard />
            </TabsContent>
          )}

          <TabsContent value="submissions" className="space-y-4">
            {loadingSubmissions ? (
              <div className="py-12 text-center text-slate-500">Loading submissions...</div>
            ) : submissions?.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-slate-800 rounded-2xl">
                <Music className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                <p className="text-slate-500 mb-6">Start your first submission to get featured.</p>
                <Button onClick={() => navigate("/booking")}>Submit Music</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {submissions?.map((s: any) => (
                  <Card 
                    key={s.id} 
                    className="bg-slate-900/30 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                    onClick={() => navigate(`/orders/${s.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                            <Music className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg">{s.track_title}</h4>
                              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="text-sm text-slate-400">{s.artist_name} • {s.slots?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right mr-4">
                            <div className="text-xs text-slate-500 mb-1">Status</div>
                            {getStatusBadge(s.status)}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">Payment</div>
                            {getPaymentBadge(s.payment_status)}
                          </div>
                        </div>
                      </div>

                      {/* Syndication Status Section */}
                      {s.submission_distribution && s.submission_distribution.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-800">
                          <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <Share2 className="w-4 h-4" />
                            <h5 className="text-xs font-bold uppercase tracking-wider">Syndication Status</h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                             {s.submission_distribution.map((dist: DistributionStatus) => (
                               <div key={dist.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-300">{dist.media_outlets?.name}</p>
                                    <div className="mt-1">
                                      {getStatusBadge(dist.status)}
                                    </div>
                                  </div>
                                </div>
                                {dist.published_url && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                    <a href={dist.published_url} target="_blank" rel="noopener noreferrer" title="View published story">
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="placements" className="space-y-4">
            {loadingPlacements ? (
              <div className="py-12 text-center text-slate-500">Loading placements...</div>
            ) : placements?.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-slate-800 rounded-2xl">
                <Layout className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No active placements</h3>
                <p className="text-slate-500 mb-6">Your music will appear here once approved and scheduled.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {placements?.map((p: any) => (
                  <Card key={p.id} className="bg-slate-900/30 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{p.submissions?.track_title}</h4>
                            <p className="text-sm text-slate-400">on {p.playlists?.name}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-6 items-center">
                          <div className="text-sm text-slate-400">
                            <div className="text-xs text-slate-500 mb-1">Duration</div>
                            {format(new Date(p.start_date), "MMM d")} - {format(new Date(p.end_date), "MMM d, yyyy")}
                          </div>
                          {p.playlists?.spotify_playlist_url && (
                            <Button variant="ghost" size="sm" asChild className="text-blue-400 hover:text-blue-300">
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
              <Card className="bg-slate-900/30 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Account Access</CardTitle>
                  <CardDescription>Your active features and services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingCapabilities ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-700" /></div>
                  ) : capabilities.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800/50">
                      No active features found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {capabilities.map((cap, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-slate-200 uppercase tracking-wider">{cap.replace('.', ' ')}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 bg-green-500/5">ACTIVE</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm h-10" onClick={() => navigate("/booking")}>
                      Get Featured
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/30 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">How it works</CardTitle>
                  <CardDescription>Access to site features</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-slate-400 space-y-4">
                  <p>When you purchase a service or get featured, you unlock specific site features.</p>
                  <ul className="space-y-2 list-disc pl-4">
                    <li>Each submission uses one active feature slot.</li>
                    <li>Features remain active as long as your service is running.</li>
                    <li>One payment can unlock multiple features.</li>
                  </ul>
                  <p className="pt-2 italic text-xs">Everything you need to manage your presence.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
             {loadingPayments ? (
              <div className="py-12 text-center text-slate-500">Loading payments...</div>
            ) : payments?.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-slate-800 rounded-2xl">
                <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No payment history</h3>
                <p className="text-slate-500">Your transaction receipts will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {payments?.map((pm: any) => (
                  <Card key={pm.id} className="bg-slate-900/30 border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">${(pm.amount_cents / 100).toFixed(2)} {pm.currency.toUpperCase()}</h4>
                            <p className="text-sm text-slate-400">{format(new Date(pm.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right mr-4">
                            <div className="text-xs text-slate-500 mb-1">Status</div>
                            <Badge className={pm.status === 'succeeded' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
                              {pm.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs font-mono text-slate-500">
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
      </div>
    </div>
  );
}
