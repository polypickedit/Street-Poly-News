
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Video, Type, Settings, ExternalLink } from "lucide-react";
import { getYouTubeId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VideoSlotEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  initialTitle?: string;
  initialDescription?: string;
  onSave: (data: { url: string; title: string; description: string; thumbnail: string; youtubeId: string }) => Promise<void>;
}

export function VideoSlotEditor({
  open,
  onOpenChange,
  initialUrl = "",
  initialTitle = "",
  initialDescription = "",
  onSave,
}: VideoSlotEditorProps) {
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [thumbnail, setThumbnail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setTitle(initialTitle);
      setDescription(initialDescription);
      setThumbnail("");
      if (initialUrl) {
         const id = getYouTubeId(initialUrl);
         if (id) setThumbnail(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
      }
    }
  }, [open, initialUrl, initialTitle, initialDescription]);

  // Auto-fetch thumbnail when URL changes
  useEffect(() => {
    const videoId = getYouTubeId(url);
    if (videoId) {
      setThumbnail(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
    } else {
      setThumbnail("");
    }
  }, [url]);

  const handleFetchMetadata = async () => {
    if (!url) return;
    const videoId = getYouTubeId(url);
    if (!videoId) {
      toast.error("Enter a valid YouTube URL first");
      return;
    }

    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-feed-refresh", {
        body: { videoIds: [videoId] },
      });

      if (error) throw error;

      const item = (data as { byId?: Record<string, { title?: string; description?: string; thumbnail?: string | null }> } | null)?.byId?.[videoId];
      if (!item) {
        toast.error("No metadata returned for this video");
        return;
      }

      if (item.title) setTitle(item.title);
      if (item.description) setDescription(item.description);
      setThumbnail(item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
      toast.success("Metadata refreshed and cached");
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
      toast.error("Could not sync metadata from YouTube");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!url || !title) return;
    const videoId = getYouTubeId(url);
    if (!videoId) {
        toast.error("Invalid YouTube URL");
        return;
    }

    setLoading(true);
    try {
      await onSave({
        url,
        title,
        description,
        thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        youtubeId: videoId
      });
      toast.success("Video updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-background border-border p-0 gap-0 grid grid-cols-1 md:grid-cols-2 overflow-hidden max-h-[90vh]">
        {/* Left Column: Editor Form */}
        <div className="p-6 space-y-8 overflow-y-auto max-h-[85vh] md:max-h-full">
            <DialogHeader className="px-1">
                <DialogTitle className="text-2xl font-display uppercase tracking-tight">Edit Video Content</DialogTitle>
                <DialogDescription>
                    Update the video content and display information.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
                {/* Content Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Video className="w-4 h-4 text-dem" />
                        <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Content</h3>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="url">Video Link</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="font-mono text-sm"
                                />
                                <Button 
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFetchMetadata}
                                    disabled={fetching || !url}
                                    title="Sync metadata from YouTube API"
                                    className="whitespace-nowrap"
                                >
                                    {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                                    Sync YouTube
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Paste a YouTube link, then use Sync to manually pull title, description, and thumbnail from YouTube API.</p>
                        </div>
                    </div>
                </section>

                {/* Display Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Type className="w-4 h-4 text-dem" />
                        <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Display Information</h3>
                    </div>

                    <div className="space-y-3">
                         <div className="space-y-1">
                            <Label htmlFor="title">Headline</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Video Headline"
                            />
                            <p className="text-[11px] text-muted-foreground">This is what appears on the homepage feed.</p>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="description">Short Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief summary..."
                                rows={3}
                                className="resize-none"
                            />
                            <p className="text-[11px] text-muted-foreground">Keep under 150 characters for best display.</p>
                        </div>
                    </div>
                </section>

                {/* Publishing Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Settings className="w-4 h-4 text-dem" />
                        <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Publishing</h3>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button 
                            onClick={handleSave} 
                            disabled={loading || !title}
                            className="bg-dem hover:bg-dem/90 text-white font-bold uppercase tracking-wider flex-1"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </section>
            </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="bg-muted/30 p-8 border-l border-border hidden md:flex flex-col justify-center items-center relative">
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Live Preview</h3>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-background/50">Feed View</Badge>
            </div>

            <div className="w-full max-w-sm pointer-events-none select-none">
                 <div className="group flex flex-col rounded-2xl border border-border bg-card shadow-xl overflow-hidden transform transition-all">
                    <div className="aspect-video bg-black relative overflow-hidden">
                        {thumbnail ? (
                            <img src={thumbnail} alt="Preview" className="w-full h-full object-cover opacity-90" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                                <Video className="w-12 h-12 opacity-20" />
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                             </div>
                        </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2 bg-card">
                        <h3 className="font-display text-lg text-dem font-black uppercase line-clamp-2 leading-tight">
                            {title || "YOUR HEADLINE HERE"}
                        </h3>
                        <p className="text-sm text-muted-foreground font-body line-clamp-2">
                            {description || "Description text will appear here..."}
                        </p>
                        <span className="mt-3 text-xs font-black uppercase tracking-widest text-dem flex items-center gap-1">
                            Watch on YouTube <ExternalLink className="w-3 h-3" />
                        </span>
                    </div>
                 </div>
            </div>
            
            <p className="absolute bottom-6 text-[10px] text-muted-foreground text-center max-w-xs">
                This preview shows how your content will appear to visitors on the homepage.
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
