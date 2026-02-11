import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Library, Users, Music, ExternalLink } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlaylistEditDialog } from "./PlaylistEditDialog";
import { Database } from "@/integrations/supabase/types";

type Playlist = Database["public"]["Tables"]["playlists"]["Row"];

export const PlaylistManager = () => {
  const queryClient = useQueryClient();
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Playlist[];
    },
  });

  const toggleActive = async (playlistId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("playlists")
      .update({ active: !currentActive })
      .eq("id", playlistId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Editorial Assets</h3>
        <Button 
          data-conduction-toggle
          className="bg-dem hover:bg-dem/90 text-white gap-2 font-black uppercase"
          onClick={() => {
            setEditingPlaylist(null);
            setIsPlaylistDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Playlist
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground animate-pulse font-black uppercase tracking-tighter">Loading assets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {playlists?.map((playlist) => (
            <Card key={playlist.id} className="bg-card border-border hover:border-muted-foreground/30 transition-all overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded bg-dem/20 flex items-center justify-center group-hover:bg-dem/30 transition-colors">
                    <Library className="w-6 h-6 text-dem" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                      {playlist.active ? "Active" : "Inactive"}
                    </span>
                    <Switch 
                      checked={playlist.active || false} 
                      onCheckedChange={() => toggleActive(playlist.id, playlist.active || false)}
                    />
                  </div>
                </div>
                <CardTitle className="mt-4 text-lg font-black text-dem uppercase truncate">
                  {playlist.name}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  {playlist.genres?.map((genre) => (
                    <Badge key={genre} variant="outline" className="text-[10px] bg-muted border-border text-muted-foreground uppercase">
                      {genre}
                    </Badge>
                  ))}
                  {playlist.moods?.map((mood) => (
                    <Badge key={mood} variant="outline" className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground/70 uppercase">
                      {mood}
                    </Badge>
                  ))}
                  {!playlist.genres?.length && !playlist.moods?.length && (
                    <Badge variant="outline" className="text-[10px] bg-muted border-border text-muted-foreground uppercase">
                      NO TAGS
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-dem/70">
                      <Users className="w-3 h-3" />
                      <span className="text-xs uppercase font-bold tracking-tight">Vibe</span>
                    </div>
                    <p className="text-sm font-black text-dem uppercase">
                      {playlist.energy_level ? `Level ${playlist.energy_level}` : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-dem/70">
                      <Music className="w-3 h-3" />
                      <span className="text-xs uppercase font-bold tracking-tight">Status</span>
                    </div>
                    <p className="text-sm font-black text-dem uppercase">
                      {playlist.active ? "Live" : "Draft"}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button 
                    data-conduction-toggle
                    variant="secondary" 
                    className="flex-1 text-xs bg-muted border-border text-dem hover:bg-muted/80 font-black uppercase"
                    onClick={() => {
                      setEditingPlaylist(playlist);
                      setIsPlaylistDialogOpen(true);
                    }}
                  >
                    Edit Details
                  </Button>
                  {playlist.spotify_playlist_url && (
                    <Button 
                      data-conduction-toggle
                      variant="ghost" 
                      className="text-xs text-dem hover:text-dem/80 hover:bg-dem/10 font-black uppercase p-2"
                      title="View on Spotify"
                      asChild
                    >
                      <a 
                        href={playlist.spotify_playlist_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="View on Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {playlists?.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-lg">
              <Library className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-black uppercase tracking-tighter">No playlists found</p>
              <p className="text-xs text-muted-foreground/60 mt-2">Add your first editorial asset to get started</p>
            </div>
          )}
        </div>
      )}

      <PlaylistEditDialog
        isOpen={isPlaylistDialogOpen}
        playlist={editingPlaylist}
        onClose={() => setIsPlaylistDialogOpen(false)}
        onSuccess={() => {
          setIsPlaylistDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["playlists"] });
        }}
      />
    </div>
  );
};
