import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Music, 
  ExternalLink, 
  Calendar, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Settings,
  User,
  Globe,
  Share2
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SubmissionDetail {
  id: string;
  status: string;
  payment_status: string;
  track_title: string;
  artist_name: string;
  created_at: string;
  spotify_track_url?: string;
  notes_internal?: string;
  slots?: { name: string };
  artists?: { name: string; email: string };
  submission_distribution?: Array<{
    id: string;
    status: string;
    published_url?: string;
    media_outlets?: { name: string };
  }>;
  placements?: Array<{
    id: string;
    end_date: string;
    playlists?: { name: string; spotify_playlist_url?: string };
  }>;
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: hasAccess } = await supabase.rpc("is_admin_or_editor");
      setIsAdmin(!!hasAccess);
    };
    checkAdmin();
  }, []);

  const { data: submissionData, isLoading, error } = useQuery({
    queryKey: ["submission", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          artists ( name, email ),
          slots ( name ),
          submission_distribution (
            *,
            media_outlets ( name )
          ),
          placements (
            *,
            playlists ( name, spotify_playlist_url )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as SubmissionDetail;
    },
  });

  const submission = submissionData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-white/5 text-white/70 border-white/10">Pending Review</Badge>;
      case "approved": return <Badge variant="outline" className="bg-dem/10 text-dem border-dem/20">Approved</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-rep/10 text-rep border-rep/20">Rejected</Badge>;
      case "scheduled": return <Badge variant="outline" className="bg-white/10 text-white border-white/20">Scheduled</Badge>;
      case "delivered": return <Badge variant="outline" className="bg-dem/20 text-white border-dem/30">Delivered</Badge>;
      default: return <Badge variant="outline" className="border-white/20 text-white/70">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge variant="outline" className="bg-dem/10 text-dem border-dem/20">Paid</Badge>;
      case "pending": return <Badge variant="outline" className="bg-white/5 text-white/70 border-white/10">Payment Pending</Badge>;
      case "failed": return <Badge variant="outline" className="bg-rep/10 text-rep border-rep/20">Payment Failed</Badge>;
      default: return <Badge variant="outline" className="border-white/20 text-white/70">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <PageLayoutWithAds>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dem" />
        </div>
      </PageLayoutWithAds>
    );
  }

  if (error || !submission) {
    return (
      <PageLayoutWithAds>
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold text-white mb-4">Request not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </PageLayoutWithAds>
    );
  }

  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              <header className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(submission.status)}
                  {getPaymentBadge(submission.payment_status)}
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  {submission.track_title}
                </h1>
                <p className="text-xl text-slate-400">
                  by {submission.artist_name} • {submission.slots?.name}
                </p>
              </header>

              {/* Details Card */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Submission Date</label>
                      <div className="flex items-center gap-2 mt-1 text-slate-200">
                        <Calendar className="w-4 h-4 text-dem" />
                        {format(new Date(submission.created_at), "MMMM d, yyyy")}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Type</label>
                      <div className="flex items-center gap-2 mt-1 text-slate-200">
                        <Music className="w-4 h-4 text-dem" />
                        {submission.slots?.name}
                      </div>
                    </div>
                  </div>

                  {submission.spotify_track_url && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Spotify Link</label>
                      <div className="mt-1">
                        <a 
                          href={submission.spotify_track_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-dem hover:text-dem/80 transition-colors"
                        >
                          {submission.spotify_track_url}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  {submission.notes_internal && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Additional Info</label>
                      <div className="mt-1 text-sm text-slate-300 whitespace-pre-wrap">
                        {submission.notes_internal}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Distribution/Placement Status */}
              {(submission.submission_distribution?.length > 0 || submission.placements?.length > 0) && (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Live Placements & Distribution</CardTitle>
                    <CardDescription>Where your music is being featured</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Playlists */}
                    {submission.placements?.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-dem/10 flex items-center justify-center">
                            <Music className="w-5 h-5 text-dem" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{p.playlists?.name}</p>
                            <p className="text-xs text-slate-500">Active until {format(new Date(p.end_date), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                        {p.playlists?.spotify_playlist_url && (
                          <Button variant="ghost" size="sm" asChild className="text-dem hover:text-dem/80">
                            <a 
                              href={p.playlists.spotify_playlist_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              aria-label={`Open playlist ${p.playlists.name} on Spotify`}
                              title={`Open playlist ${p.playlists.name} on Spotify`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}

                    {/* Media Outlets */}
                    {submission.submission_distribution?.map((dist) => (
                      <div key={dist.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-dem/10 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-dem" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{dist.media_outlets?.name}</p>
                            <div className="mt-1">
                              {getStatusBadge(dist.status)}
                            </div>
                          </div>
                        </div>
                        {dist.published_url && (
                          <Button variant="ghost" size="sm" asChild className="text-dem hover:text-dem/80">
                            <a 
                              href={dist.published_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              aria-label={`View publication on ${dist.media_outlets?.name}`}
                              title={`View publication on ${dist.media_outlets?.name}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Controls */}
            <div className="space-y-8">
              {/* Communication Card (Placeholder for now) */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Updates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-slate-400 italic">
                    No new updates for this request.
                  </div>
                  <Button variant="outline" className="w-full text-xs" disabled>
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              {/* Admin Overlay - "Reveal Responsibility Gradually" */}
              {isAdmin && (
                <Card className="bg-rep/5 border-rep/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-2">
                    <ShieldCheck className="w-4 h-4 text-rep/40" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg text-rep flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Management
                    </CardTitle>
                    <CardDescription className="text-rep/60">Admin status controls</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-[0.2em] text-rep/70">Update Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs border-rep/30 hover:bg-rep/10"
                          onClick={() => {
                            toast({ title: "Status Update", description: "Updating to Approved..." });
                          }}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs border-rep/30 hover:bg-rep/10"
                          onClick={() => {
                            toast({ title: "Status Update", description: "Updating to Rejected..." });
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-rep/10">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm text-rep/80 hover:text-rep hover:bg-rep/5 px-0"
                        onClick={() => navigate("/admin/submissions")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Go to Admin Queue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* User Account Info */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Requester
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-200">{submission.artists?.name}</p>
                    <p className="text-sm text-slate-500">{submission.artists?.email}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
}
