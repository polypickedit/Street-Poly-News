import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Music, Tag, Activity, ListMusic, Headphones } from "lucide-react";
import { EditorialLayout, PreviewArea, ControlPanel } from "./editor/EditorialLayout";
import { PreviewCard } from "./editor/PreviewCard";
import { AdvancedSettingsAccordion } from "./editor/AdvancedSettingsAccordion";
import { SaveBar } from "./editor/SaveBar";

interface ListeningSessionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
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

export function ListeningSessionEditor({
  open,
  onOpenChange,
  session,
  onSuccess,
}: ListeningSessionEditorProps) {
  const [name, setName] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [energy, setEnergy] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      setName(session.name);
      setSpotifyUrl(session.spotify_playlist_url);
      setGenres(session.genres || []);
      setMoods(session.moods || []);
      setEnergy(session.energy_level?.toString() || "");
      setNotes(session.submission_notes || "");
      setActive(session.active);
    } else {
      setName("");
      setSpotifyUrl("");
      setGenres([]);
      setMoods([]);
      setEnergy("");
      setNotes("");
      setActive(true);
    }
  }, [session, open]);

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
      toast.error("Missing fields", {
        description: "Name and Spotify URL are required.",
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
      if (session) {
        const { error: updateError } = await supabase
          .from("playlists")
          .update(payload)
          .eq("id", session.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("playlists")
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(session ? "Session updated" : "Session created", {
        description: `${name} has been ${session ? "updated" : "created"} successfully.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("Operation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
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

  const spotifyId = extractSpotifyId(spotifyUrl);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl border-border text-foreground p-0">
        <EditorialLayout>
          {/* Left: Preview Area */}
          <PreviewArea>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Session Preview
            </h3>
            <PreviewCard
              title={name || "Untitled Session"}
              subtitle={active ? "Active & Visible" : "Inactive (Draft)"}
              status={active ? "live" : "draft"}
              className="mb-6"
            >
              {spotifyId && (
                <div className="mt-4 rounded-md overflow-hidden bg-black/5">
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${spotifyId}`}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="encrypted-media"
                    title="Spotify Embed"
                  />
                </div>
              )}
              {!spotifyId && (
                <div className="mt-4 h-[152px] rounded-md bg-muted/30 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border">
                  <Headphones className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">Enter a valid Spotify URL to preview</span>
                </div>
              )}
            </PreviewCard>
          </PreviewArea>

          {/* Right: Control Panel */}
          <ControlPanel>
            <div className="mb-2">
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl font-display">
                  {session ? "Edit Session" : "New Session"}
                </SheetTitle>
                <SheetDescription>
                  Configure session details, tags, and visibility.
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className="space-y-6">
              {/* Core Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Session Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Midnight Tech House"
                    className="bg-background border-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spotifyUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Spotify URL
                  </Label>
                  <div className="relative">
                    <ListMusic className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="spotifyUrl"
                      value={spotifyUrl}
                      onChange={(e) => setSpotifyUrl(e.target.value)}
                      placeholder="https://open.spotify.com/playlist/..."
                      className="pl-9 bg-background border-input"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Genres
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {["HOUSE", "TECHNO", "HIP-HOP", "R&B", "POP", "ROCK"].map((g) => (
                      <button
                        key={g}
                        onClick={() => toggleItem(genres, setGenres, g)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all border",
                          genres.includes(g)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Moods
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {["ENERGETIC", "CHILL", "DARK", "HAPPY", "MELODIC"].map((m) => (
                      <button
                        key={m}
                        onClick={() => toggleItem(moods, setMoods, m)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all border",
                          moods.includes(m)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <AdvancedSettingsAccordion>
                <div className="space-y-5 pb-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="active" className="text-xs text-muted-foreground font-semibold">
                        Visibility Status
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {active ? "Live" : "Hidden"}
                        </span>
                        <Switch
                          id="active"
                          checked={active}
                          onCheckedChange={setActive}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="energy" className="text-xs text-muted-foreground font-semibold">
                      Energy Level (1-10)
                    </Label>
                    <Input
                      id="energy"
                      type="number"
                      min="1"
                      max="10"
                      value={energy}
                      onChange={(e) => setEnergy(e.target.value)}
                      className="bg-background border-input h-8 w-24"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-xs text-muted-foreground font-semibold">
                      Editorial Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal requirements..."
                      className="bg-background border-input min-h-[80px] text-xs"
                    />
                  </div>
                </div>
              </AdvancedSettingsAccordion>

              {/* Save Bar */}
              <SaveBar
                onSave={handleSave}
                isSaving={loading}
                isDisabled={loading || !name || !spotifyUrl}
                label={session ? "Save Changes" : "Create Session"}
              />
            </div>
          </ControlPanel>
        </EditorialLayout>
      </SheetContent>
    </Sheet>
  );
}
