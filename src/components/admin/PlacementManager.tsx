import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Progress } from "@/components/ui/progress";
import { History, Calendar, RefreshCw, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PlacementEditDialog } from "@/components/admin/PlacementEditDialog";

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
  const queryClient = useQueryClient();
  const [editingPlacement, setEditingPlacement] = useState<Placement | null>(null);

  const {
    data: placements,
    isLoading,
    refetch,
    isFetching,
    isError,
    error,
  } = useQuery({
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

  const renderPlacementRow = (placement: Placement) => (
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
          <Progress 
            value={getProgress(placement.start_date, placement.end_date)} 
            className="w-24 h-1 bg-muted"
            indicatorClassName="bg-dem"
          />
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
  );

  const calculateTimeLeft = (endDate: string) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const end = parseISO(endDate).getTime();
    const now = Date.now();
    const msLeft = end - now;
    return msLeft > 0 ? Math.ceil(msLeft / msPerDay) : 0;
  };

  const getProgress = (startDate: string, endDate: string) => {
    const start = parseISO(startDate).getTime();
    const end = parseISO(endDate).getTime();
    const now = Date.now();

    if (now <= start) return 0;
    if (now >= end) return 100;

    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-dem" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted">
        <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-muted-foreground mb-2">Failed to load placements</h4>
        <p className="text-muted-foreground mb-4">{(error as Error)?.message ?? "Unknown error"}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const now = new Date();
  const allPlacements = placements ?? [];
  const activePlacements = allPlacements.filter((p) => parseISO(p.end_date) > now);
  const endingSoonPlacements = activePlacements.filter((p) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const end = parseISO(p.end_date).getTime();
    const daysLeft = (end - now.getTime()) / msPerDay;
    return daysLeft <= 7;
  });
  const historicalPlacements = allPlacements.filter((p) => parseISO(p.end_date) <= now);

  return (
    <div className="space-y-6 text-foreground">
      <Tabs defaultValue="active" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="active" className="data-[state=active]:bg-dem data-[state=active]:text-foreground text-muted-foreground font-black uppercase tracking-widest text-xs">
              Active ({activePlacements.length})
            </TabsTrigger>
            <TabsTrigger value="ending" className="data-[state=active]:bg-dem data-[state=active]:text-foreground text-muted-foreground font-black uppercase tracking-widest text-xs">
              Ending Soon ({endingSoonPlacements.length})
            </TabsTrigger>
            <TabsTrigger value="historical" className="data-[state=active]:bg-dem data-[state=active]:text-foreground text-muted-foreground font-black uppercase tracking-widest text-xs">
              Historical ({historicalPlacements.length})
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-muted border-border text-foreground hover:bg-muted/80 gap-2 font-black uppercase tracking-widest text-xs"
          >
            {isFetching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
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
                  activePlacements.map((placement) => renderPlacementRow(placement))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="ending" className="m-0">
          {endingSoonPlacements.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted">
              <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-muted-foreground">
                No placements ending in the next 7 days
              </h4>
            </div>
          ) : (
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
                  {endingSoonPlacements.map((placement) => renderPlacementRow(placement))}
                </TableBody>
              </Table>
            </div>
          )}
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
          setEditingPlacement(null);
          queryClient.invalidateQueries({ queryKey: ["admin-placements"] });
        }}
      />
    </div>
  );
};
