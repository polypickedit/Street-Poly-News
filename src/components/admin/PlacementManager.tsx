import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { History, Calendar, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from "date-fns";
import { PlacementEditDialog } from "./PlacementEditDialog";

interface Placement {
  id: string;
  submission_id: string;
  playlist_id: string;
  start_date: string;
  end_date: string;
  submissions: {
    track_title: string;
    artist_name: string;
    genre: string;
    mood: string;
  };
  playlists: {
    id: string;
    name: string;
  };
}

export const PlacementManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPlacement, setEditingPlacement] = useState<Placement | null>(null);

  const { data: placements, isLoading, refetch } = useQuery({
    queryKey: ["admin-placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placements")
        .select(`
          id,
          submission_id,
          playlist_id,
          start_date,
          end_date,
          submissions (
            track_title,
            artist_name,
            genre,
            mood
          ),
          playlists (
            id,
            name
          )
        `);
      
      if (error) throw error;
      return data as unknown as Placement[];
    },
  });

  const handleManageClick = (placement: Placement) => {
    setEditingPlacement(placement);
  };

  const calculateTimeLeft = (endDate: string) => {
    const end = parseISO(endDate);
    const now = new Date();
    const days = differenceInDays(end, now);
    return days > 0 ? days : 0;
  };

  const getProgress = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const now = new Date();
    
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    
    if (total <= 0) return 100;
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return progress;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-dem" />
      </div>
    );
  }

  const activePlacements = placements?.filter(p => new Date(p.end_date) > new Date()) || [];
  const historicalPlacements = placements?.filter(p => new Date(p.end_date) <= new Date()) || [];

  return (
    <div className="space-y-6 text-foreground">
      <Tabs defaultValue="active" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="active" className="data-[state=active]:bg-dem data-[state=active]:text-foreground text-muted-foreground font-black uppercase tracking-widest text-xs">Active ({activePlacements.length})</TabsTrigger>
            <TabsTrigger value="ending" className="data-[state=active]:bg-dem data-[state=active]:text-foreground text-muted-foreground font-black uppercase tracking-widest text-xs">Ending Soon</TabsTrigger>
            <TabsTrigger value="historical" className="data-[state=active]:bg-dem data-[state=active]:text-foreground text-muted-foreground font-black uppercase tracking-widest text-xs">Historical ({historicalPlacements.length})</TabsTrigger>
          </TabsList>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="bg-muted border-border text-foreground hover:bg-muted/80 gap-2 font-black uppercase tracking-widest text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh Status
          </Button>
        </div>

        <TabsContent value="active" className="m-0">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Track</TableHead>
                  <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Playlist</TableHead>
                  <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Duration</TableHead>
                  <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Time Left</TableHead>
                  <TableHead className="text-right text-muted-foreground font-black uppercase tracking-widest text-[10px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePlacements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                      No active placements found
                    </TableCell>
                  </TableRow>
                ) : (
                  activePlacements.map((placement) => (
                    <TableRow key={placement.id} className="border-border hover:bg-muted transition-colors">
                      <TableCell>
                        <div className="font-black text-dem uppercase">{placement.submissions?.track_title}</div>
                        <div className="text-xs text-muted-foreground italic">
                          {placement.submissions?.artist_name} • {placement.submissions?.genre}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-dem/10 text-dem border-dem/20 font-black">
                            {placement.playlists?.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(placement.start_date), "MMM dd")} - {format(parseISO(placement.end_date), "MMM dd")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-foreground">{calculateTimeLeft(placement.end_date)} Days</span>
                          <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-dem" style={{ width: `${getProgress(placement.start_date, placement.end_date)}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-dem hover:text-dem/80 hover:bg-dem/10 font-black uppercase tracking-widest text-xs"
                          onClick={() => handleManageClick(placement)}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="ending" className="m-0">
          <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted">
            <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-muted-foreground">No placements ending in the next 7 days</h4>
          </div>
        </TabsContent>

        <TabsContent value="historical" className="m-0">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Track</TableHead>
                  <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Playlist</TableHead>
                  <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Ended</TableHead>
                  <TableHead className="text-right text-muted-foreground font-black uppercase tracking-widest text-[10px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalPlacements.map((placement) => (
                  <TableRow key={placement.id} className="border-border hover:bg-muted transition-colors opacity-60">
                    <TableCell>
                      <div className="font-black text-foreground uppercase">{placement.submissions?.track_title}</div>
                      <div className="text-xs text-muted-foreground italic">
                        {placement.submissions?.artist_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-black">
                        {placement.playlists?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-bold">
                      {format(parseISO(placement.end_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-foreground hover:bg-muted font-black uppercase tracking-widest text-xs"
                        onClick={() => handleManageClick(placement)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <PlacementEditDialog 
        isOpen={!!editingPlacement}
        onClose={() => setEditingPlacement(null)}
        placement={editingPlacement}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-placements"] });
        }}
      />
    </div>
  );
};

