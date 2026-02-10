import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Playlist {
  id: string;
  name: string;
}

interface Placement {
  id: string;
  submission_id: string;
  playlist_id: string;
  start_date: string;
  end_date: string;
  submissions: {
    track_title: string;
    artist_name: string;
  };
}

interface PlacementEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  placement: Placement | null;
  onSuccess: () => void;
}

export const PlacementEditDialog = ({
  isOpen,
  onClose,
  placement,
  onSuccess,
}: PlacementEditDialogProps) => {
  const [playlistId, setPlaylistId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { data: playlists, isLoading: loadingPlaylists } = useQuery({
    queryKey: ["admin-playlists-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("active", true);
      
      if (error) throw error;
      return data as Playlist[];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (placement) {
      setPlaylistId(placement.playlist_id);
      setStartDate(parseISO(placement.start_date));
      setEndDate(parseISO(placement.end_date));
    }
  }, [placement]);

  const handleSave = async () => {
    if (!placement || !playlistId || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before saving.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("placements")
        .update({
          playlist_id: playlistId,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
        })
        .eq("id", placement.id);

      if (error) throw error;

      toast({
        title: "Placement updated",
        description: `Placement for "${placement.submissions.track_title}" has been updated.`,
      });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground font-black uppercase tracking-widest">
            Edit Placement
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-1">
            <p className="text-sm font-black text-dem uppercase">
              {placement?.submissions.track_title}
            </p>
            <p className="text-xs text-muted-foreground italic">
              {placement?.submissions.artist_name}
            </p>
          </div>

          <div className="grid gap-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
              Channel / Partner (Playlist)
            </Label>
            <Select value={playlistId} onValueChange={setPlaylistId}>
              <SelectTrigger className="bg-muted border-border text-foreground focus:ring-dem">
                <SelectValue placeholder="Select a playlist" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {loadingPlaylists ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin text-dem" />
                  </div>
                ) : (
                  playlists?.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id} className="text-foreground focus:bg-dem/10 focus:text-dem">
                      {playlist.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted border-border hover:bg-muted/80",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="text-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted border-border hover:bg-muted/80",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="text-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="bg-muted border-border text-foreground hover:bg-muted/80 font-black uppercase tracking-widest text-xs"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="bg-dem hover:bg-dem/90 text-white font-black uppercase tracking-widest text-xs"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
