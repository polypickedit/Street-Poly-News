import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Submission {
  id: string;
  track_title: string;
  artist_name: string;
  status: string;
  payment_status: string;
  created_at: string;
  slots?: {
    name: string;
  };
  placements?: {
    id: string;
  }[];
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

export const UnifiedQueue = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("awaiting_approval");

  // Query for "Paid and awaiting approval"
  const { data: awaitingApproval, isLoading: loadingApproval, error: errorApproval, refetch: refetchApproval } = useQuery({
    queryKey: ["admin-awaiting-approval"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, artists ( name, email ), slots ( name )")
        .eq("status", "pending_review")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("UnifiedQueue: Error fetching awaiting approval:", error);
        throw error;
      }
      return data as unknown as Submission[];
    }
  });

  // Real-time subscription for admin queue
  useEffect(() => {
    const channel = supabase
      .channel('admin-queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions'
        },
        () => {
          console.log('Admin Real-time update: refetching queue');
          refetchApproval();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchApproval]);

  // Query for "Approved but not scheduled (Paid but not scheduled)"
  const { data: awaitingSchedule, isLoading: loadingSchedule, error: errorSchedule } = useQuery({
    queryKey: ["admin-awaiting-schedule"],
    queryFn: async () => {
      // Find approved submissions that don't have a placement yet
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          artists ( name ),
          slots ( name ),
          placements ( id )
        `)
        .eq("status", "approved")
        .eq("payment_status", "paid");
      
      if (error) {
        console.error("UnifiedQueue: Error fetching awaiting schedule:", error);
        throw error;
      }
      // Filter out those with placements manually if join isn't perfect
      return (data as unknown as Submission[]).filter((s) => !s.placements || s.placements.length === 0);
    }
  });

  // Query for "Active Placements"
  const { data: activePlacements, isLoading: loadingActive, error: errorActive } = useQuery({
    queryKey: ["admin-active-placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placements")
        .select(`
          *,
          playlists ( name, spotify_playlist_url ),
          submissions ( track_title, artist_name )
        `)
        .gt("end_date", new Date().toISOString())
        .order("end_date", { ascending: true });
      
      if (error) {
        console.error("UnifiedQueue: Error fetching active placements:", error);
        throw error;
      }
      return data as unknown as Placement[];
    }
  });

  // Query for "Completed Placements"
  const { data: completedPlacements, isLoading: loadingCompleted, error: errorCompleted } = useQuery({
    queryKey: ["admin-completed-placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placements")
        .select(`
          *,
          playlists ( name ),
          submissions ( track_title, artist_name )
        `)
        .lt("end_date", new Date().toISOString())
        .order("end_date", { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("UnifiedQueue: Error fetching completed placements:", error);
        throw error;
      }
      return data as unknown as Placement[];
    }
  });

  // Query for "Expiring Soon" (Placements ending in next 7 days)
  const { data: expiringSoon, isLoading: loadingExpiring, error: errorExpiring } = useQuery({
    queryKey: ["admin-expiring-soon"],
    queryFn: async ({ signal }) => {
      try {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const { data, error } = await supabase
          .from("placements")
          .select("*, playlists ( name ), submissions ( track_title, artist_name )")
          .gte("end_date", new Date().toISOString())
          .lte("end_date", sevenDaysFromNow.toISOString())
          .order("end_date", { ascending: true })
          .abortSignal(signal);
        if (error) {
          console.error("UnifiedQueue: Error fetching expiring soon:", error);
          throw error;
        }
        return data as unknown as Placement[];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    }
  });

  const renderError = (error: Error) => (
    <div className="text-center py-12 text-rep border border-dashed border-rep/30 rounded-lg">
      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>Error loading data: {error.message || "Unknown error"}</p>
      <Button 
        variant="link" 
        className="text-dem mt-2"
        onClick={() => window.location.reload()}
      >
        Retry
      </Button>
    </div>
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-dem" />
    </div>
  );

  const renderEmpty = (message: string) => (
    <div className="text-center py-12 text-muted-foreground font-medium border border-dashed border-border rounded-lg">
      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-dem" />
      <p>{message}</p>
    </div>
  );

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Unified Queue</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-dem/10 text-dem border-dem/20 font-bold">
            {awaitingApproval?.length || 0} Awaiting Approval
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-bold">
            {awaitingSchedule?.length || 0} Needs Scheduling
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="awaiting_approval" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border p-1 mb-6">
          <TabsTrigger value="awaiting_approval" className="data-[state=active]:bg-muted text-foreground font-bold">
            Awaiting Approval
          </TabsTrigger>
          <TabsTrigger value="needs_scheduling" className="data-[state=active]:bg-muted text-foreground font-bold">
            Needs Scheduling
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-muted text-foreground font-bold">
            Active Placements
          </TabsTrigger>
          <TabsTrigger value="expiring" className="data-[state=active]:bg-muted text-foreground font-bold">
            Expiring Soon
          </TabsTrigger>
        </TabsList>

        <TabsContent value="awaiting_approval">
          {loadingApproval ? renderLoading() : errorApproval ? renderError(errorApproval) : !awaitingApproval?.length ? renderEmpty("All paid submissions have been reviewed.") : (
            <Table className="border border-border rounded-lg overflow-hidden">
              <TableHeader className="bg-muted">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Track</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Artist</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Offer</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awaitingApproval.map((s) => (
                  <TableRow key={s.id} className="border-border hover:bg-muted">
                    <TableCell className="font-black text-dem uppercase">{s.track_title}</TableCell>
                    <TableCell className="text-foreground font-medium">{s.artist_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-dem/10 text-dem border-none font-bold">
                        {s.slots?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" className="bg-dem hover:bg-dem/90 text-white font-bold" onClick={() => navigate("/admin/submissions")}>
                        Review <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="needs_scheduling">
          {loadingSchedule ? renderLoading() : errorSchedule ? renderError(errorSchedule) : !awaitingSchedule?.length ? renderEmpty("All approved submissions are scheduled.") : (
            <Table className="border border-border rounded-lg overflow-hidden">
              <TableHeader className="bg-muted">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Track</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Artist</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awaitingSchedule.map((s) => (
                  <TableRow key={s.id} className="border-border hover:bg-muted">
                    <TableCell className="font-black text-dem uppercase">{s.track_title}</TableCell>
                    <TableCell className="text-foreground font-medium">{s.artist_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-white bg-dem border-dem/30 font-bold">Approved</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" className="bg-dem hover:bg-dem/90 text-white font-bold" onClick={() => navigate("/admin/placements")}>
                        Schedule <Calendar className="w-4 h-4 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="active">
          {loadingActive ? renderLoading() : errorActive ? renderError(errorActive) : !activePlacements?.length ? renderEmpty("No placements are currently live.") : (
            <Table className="border border-border rounded-lg overflow-hidden">
              <TableHeader className="bg-muted">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Track</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Playlist</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Ends In</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePlacements.map((p) => (
                  <TableRow key={p.id} className="border-border hover:bg-muted">
                    <TableCell className="font-black text-dem uppercase">{p.submissions?.track_title}</TableCell>
                    <TableCell className="text-foreground font-medium">{p.playlists?.name}</TableCell>
                    <TableCell className="text-foreground font-bold">
                      {format(new Date(p.end_date), "MMM d")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="sm" asChild className="text-dem hover:text-dem/80">
                        <a href={p.playlists?.spotify_playlist_url} target="_blank" rel="noopener noreferrer" title="View on Spotify">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="expiring">
          {loadingExpiring ? renderLoading() : errorExpiring ? renderError(errorExpiring) : !expiringSoon?.length ? renderEmpty("No placements expiring in the next 7 days.") : (
            <Table className="border border-border rounded-lg overflow-hidden">
              <TableHeader className="bg-muted">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Track</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Playlist</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Expiry Date</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringSoon.map((p) => (
                  <TableRow key={p.id} className="border-border hover:bg-muted">
                    <TableCell className="font-black text-dem uppercase">{p.submissions?.track_title}</TableCell>
                    <TableCell className="text-foreground font-medium">{p.playlists?.name}</TableCell>
                    <TableCell className="text-rep font-bold">
                      {format(new Date(p.end_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-rep border-rep/30 font-bold">
                        Ending Soon
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
