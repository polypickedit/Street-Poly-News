import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Music, Tag } from "lucide-react";

interface PlaylistEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: {
    id: string;
    name: string;
    spotify_playlist_id: string | null;
    spotify_playlist_url: string;
    genres: string[];
    moods: string[];
    energy_level: number | null;
    submission_notes: string | null;
    active: boolean;
  } | null;
  onSuccess: () => void;
}

export const PlaylistEditDialog = ({
  isOpen,
  onClose,
  playlist,
  onSuccess,
}: PlaylistEditDialogProps) => {
  const [name, setName] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [energy, setEnergy] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setSpotifyUrl(playlist.spotify_playlist_url);
      setGenres(playlist.genres || []);
      setMoods(playlist.moods || []);
      setEnergy(playlist.energy_level?.toString() || "");
      setNotes(playlist.submission_notes || "");
      setActive(playlist.active);
    } else {
      setName("");
      setSpotifyUrl("");
      setGenres([]);
      setMoods([]);
      setEnergy("");
      setNotes("");
      setActive(true);
    }
  }, [playlist, isOpen]);

  const extractSpotifyId = (url: string) => {
    try {
      const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (!name || !spotifyUrl) {
      toast({
        title: "Missing fields",
        description: "Name and Spotify URL are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const spotifyId = extractSpotifyId(spotifyUrl);
      const energyLevel = energy ? parseInt(energy) : null;

      const payload = {
        name,
        spotify_playlist_url: spotifyUrl,
        spotify_playlist_id: spotifyId,
        genres,
        moods,
        energy_level: energyLevel,
        submission_notes: notes,
        active,
        // Fallback for old columns
        primary_genre: genres[0] || "General",
        primary_mood: moods[0] || "General",
      };

      let error;
      if (playlist) {
        const { error: updateError } = await supabase
          .from("playlists")
          .update(payload)
          .eq("id", playlist.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("playlists")
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: playlist ? "Playlist updated" : "Playlist created",
        description: `${name} has been ${playlist ? "updated" : "created"} successfully.`,
      });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-black uppercase tracking-widest">
            {playlist ? `Edit Playlist: ${playlist.name}` : "Add New Spotify Playlist"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Playlist Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Midnight Tech House"
              className="bg-muted border-border text-foreground focus:border-dem"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="spotifyUrl" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Spotify URL</Label>
            <Input
              id="spotifyUrl"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="bg-muted border-border text-foreground focus:border-dem"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Genres</Label>
            <div className="flex flex-wrap gap-2">
              {["HOUSE", "TECHNO", "HIP-HOP", "R&B", "POP", "ROCK"].map((g) => (
                <Badge
                  key={g}
                  variant={genres.includes(g) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer uppercase text-[10px] tracking-tight",
                    genres.includes(g) ? "bg-dem text-white" : "text-muted-foreground"
                  )}
                  onClick={() => toggleItem(genres, setGenres, g)}
                >
                  {g}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Moods</Label>
            <div className="flex flex-wrap gap-2">
              {["ENERGETIC", "CHILL", "DARK", "HAPPY", "MELODIC"].map((m) => (
                <Badge
                  key={m}
                  variant={moods.includes(m) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer uppercase text-[10px] tracking-tight",
                    moods.includes(m) ? "bg-dem text-white" : "text-muted-foreground"
                  )}
                  onClick={() => toggleItem(moods, setMoods, m)}
                >
                  {m}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="energy" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Energy Level (1-10)</Label>
              <Input
                id="energy"
                type="number"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                placeholder="e.g. 8"
                className="bg-muted border-border text-foreground focus:border-dem"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border mt-auto">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Active</Label>
                <p className="text-[10px] text-muted-foreground">Visible to curators</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Submission Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal requirements or editorial notes..."
              className="bg-muted border-border text-foreground focus:border-dem min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="bg-muted border-border text-foreground hover:bg-muted/80 uppercase font-bold text-xs">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-dem hover:bg-dem/90 text-white uppercase font-black">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {playlist ? "Save Changes" : "Create Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
