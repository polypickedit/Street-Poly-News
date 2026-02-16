import React, { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { ContentType, ContentPlacement } from "@/types/cms";
import { Post } from "@/hooks/usePosts";
import {
  History,
  Smartphone,
  Monitor,
  Calendar,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { VideoSlotEditor } from "@/components/admin/VideoSlotEditor";
import { useAuth } from "@/hooks/useAuth";

// Editor Primitives
import { EditorialLayout, PreviewArea, ControlPanel } from "./editor/EditorialLayout";
import { PreviewCard } from "./editor/PreviewCard";
import { ContentPicker } from "./editor/ContentPicker";
import { ChangeReasonField } from "./editor/ChangeReasonField";
import { AdvancedSettingsAccordion } from "./editor/AdvancedSettingsAccordion";
import { SaveBar } from "./editor/SaveBar";

interface ConductDrawerProps {
  slotKey: string;
  accepts: ContentType[];
  isOpen: boolean;
  onClose: () => void;
}

export function ConductDrawer({
  slotKey,
  accepts,
  isOpen,
  onClose,
}: ConductDrawerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"featured" | "all">("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState("");
  const [deviceScope, setDeviceScope] = useState<"all" | "mobile" | "desktop">("all");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const humanSlotTitle = useMemo(
    () => slotKey.replace(/[._]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    [slotKey]
  );

  // 1. Fetch current placement
  const { data: currentPlacement } = useQuery({
    queryKey: ["slot-content", slotKey],
    queryFn: async ({ signal }) => {
      const { data } = await (supabase as SupabaseClient)
        .from("content_placements")
        .select("*")
        .eq("slot_key", slotKey)
        .eq("active", true)
        .order("priority", { ascending: false })
        .limit(1)
        .abortSignal(signal)
        .maybeSingle();

      return data as unknown as ContentPlacement | null;
    },
    enabled: isOpen,
  });

  const { data: currentLivePost } = useQuery({
    queryKey: ["current-placement-post", currentPlacement?.content_id ?? null],
    queryFn: async ({ signal }) => {
      if (!currentPlacement?.content_id) return null;

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", parseInt(currentPlacement.content_id)) // Parsed to int based on previous fix
        .abortSignal(signal)
        .maybeSingle();

      if (error) throw error;
      return (data as Post | null) ?? null;
    },
    enabled: isOpen && !!currentPlacement?.content_id,
  });

  // 2. Fetch available content
  const { data: availablePosts, isLoading: loadingPosts } = useQuery({
    queryKey: ["available-posts", accepts, filterType],
    queryFn: async ({ signal }) => {
      const query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
        .abortSignal(signal);

      if (filterType === "featured") {
        query.eq("is_featured", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
    enabled: isOpen,
  });

  const filteredPosts = useMemo(() => {
    const rows = availablePosts ?? [];
    if (!searchQuery.trim()) return rows;

    const q = searchQuery.toLowerCase();
    return rows.filter((post) => {
      const title = post.title.toLowerCase();
      const subtitle = (post.subtitle ?? "").toLowerCase();
      return title.includes(q) || subtitle.includes(q);
    });
  }, [availablePosts, searchQuery]);

  const selectedPost = useMemo(
    () => (availablePosts ?? []).find((post) => post.id.toString() === selectedContentId) ?? null,
    [availablePosts, selectedContentId]
  );

  // 3. Mutation to update placement
  const conductMutation = useMutation({
    mutationFn: async ({ contentId, reason }: { contentId: string; reason: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { error } = await (supabase as SupabaseClient)
        .from("content_placements")
        .insert({
          slot_key: slotKey,
          content_type: "video",
          content_id: contentId,
          priority: (currentPlacement?.priority || 0) + 1,
          updated_by: user?.id,
          device_scope: deviceScope,
          starts_at: startsAt || null,
          ends_at: endsAt || null,
          metadata: { reason },
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slot-content", slotKey] });
      toast.success(`${humanSlotTitle} updated successfully.`);
      setReason("");
      onClose();
    },
    onError: (err: Error) => {
      toast.error(`Update failed: ${err.message}`);
    },
  });

  // 4. Mutation to revert (deactivate current)
  const revertMutation = useMutation({
    mutationFn: async () => {
      if (!currentPlacement) return;
      const { error } = await (supabase as SupabaseClient)
        .from("content_placements")
        .update({ active: false })
        .eq("id", currentPlacement.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slot-content", slotKey] });
      toast.success(`${humanSlotTitle} reverted.`);
      onClose();
    },
  });

  const handleSave = () => {
    if (selectedContentId) {
      conductMutation.mutate({ contentId: selectedContentId, reason });
    }
  };

  const handleCreateVideo = async (data: {
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    youtubeId: string;
  }) => {
    try {
      const { data: newPost, error } = await supabase
        .from("posts")
        .insert({
          title: data.title,
          subtitle: data.description,
          youtube_id: data.youtubeId,
          thumbnail_url: data.thumbnail,
          content_type: "video",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      if (!newPost) throw new Error("No post returned");

      await queryClient.invalidateQueries({ queryKey: ["available-posts"] });
      setSelectedContentId(newPost.id.toString());
      setSearchQuery("");
      setFilterType("all");

      toast.success("Video created and selected.");
    } catch (error) {
      console.error("Error creating video:", error);
      toast.error("Failed to create video");
    }
  };

  const handleUpdateVideo = async (data: {
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    youtubeId: string;
  }) => {
    if (!editingPost) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          title: data.title,
          subtitle: data.description,
          youtube_id: data.youtubeId,
          thumbnail_url: data.thumbnail,
        })
        .eq("id", editingPost.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["available-posts"] });
      toast.success("Video updated.");
      setEditingPost(null);
    } catch (error) {
      console.error("Error updating video:", error);
      toast.error("Failed to update video");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl border-border text-foreground p-0">
        <EditorialLayout>
          {/* Left: Content Canvas */}
          <PreviewArea>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Live Now</h3>
            <PreviewCard 
              title={currentLivePost?.title || "Empty Slot"} 
              subtitle={currentPlacement ? `Live since ${new Date(currentPlacement.created_at).toLocaleDateString()}` : "No content active"}
              thumbnail={currentLivePost?.thumbnail_url || undefined}
              status="live"
              className="mb-6"
            >
               {currentPlacement && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => revertMutation.mutate()} 
                    disabled={revertMutation.isPending} 
                    className="mt-2 h-7 text-xs w-full bg-background/50 hover:bg-destructive/10 hover:text-destructive border-dashed"
                  >
                    <History className="w-3 h-3 mr-2" /> Revert to Empty
                  </Button>
               )}
            </PreviewCard>

            {/* Selected Replacement Preview */}
            {selectedPost && selectedPost.id.toString() !== currentPlacement?.content_id && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 my-4 justify-center opacity-50">
                   <ArrowDown className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Replacing With</h3>
                <PreviewCard 
                  title={selectedPost.title}
                  subtitle="Ready to publish"
                  thumbnail={selectedPost.thumbnail_url || undefined}
                  status="selected"
                />
              </div>
            )}
          </PreviewArea>

          {/* Right: Controls Panel */}
          <ControlPanel>
            <div className="mb-2">
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl font-display">Edit {humanSlotTitle}</SheetTitle>
                <SheetDescription>Choose content to display in this slot.</SheetDescription>
              </SheetHeader>
            </div>

            <ContentPicker 
              items={filteredPosts.map(p => ({
                id: p.id.toString(),
                title: p.title,
                thumbnail: p.thumbnail_url || undefined,
                type: p.content_type,
                date: new Date(p.created_at).toLocaleDateString()
              }))}
              selectedId={selectedContentId}
              onSelect={setSelectedContentId}
              onCreate={() => setIsCreateOpen(true)}
              loading={loadingPosts}
              filterOptions={[
                { label: 'Featured', value: 'featured' },
                { label: 'All Posts', value: 'all' }
              ]}
              currentFilter={filterType}
              onFilterChange={(val) => setFilterType(val as 'featured' | 'all')}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <ChangeReasonField 
              value={reason} 
              onChange={setReason} 
            />

            <AdvancedSettingsAccordion>
               <div className="space-y-5 pb-1">
                  <div className="space-y-3">
                    <h3 className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
                      <Monitor className="w-3 h-3" /> Target Audience
                    </h3>
                    <div className="flex gap-2">
                      {(["all", "mobile", "desktop"] as const).map((scope) => (
                        <button
                          key={scope}
                          onClick={() => setDeviceScope(scope)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-2 rounded border transition-all text-xs font-medium",
                            deviceScope === scope
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {scope === "mobile" && <Smartphone className="w-3 h-3" />}
                          {scope === "desktop" && <Monitor className="w-3 h-3" />}
                          {scope}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Scheduling
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Starts At</label>
                        <Input
                          type="datetime-local"
                          value={startsAt}
                          onChange={(e) => setStartsAt(e.target.value)}
                          className="bg-background border-input text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Ends At</label>
                        <Input
                          type="datetime-local"
                          value={endsAt}
                          onChange={(e) => setEndsAt(e.target.value)}
                          className="bg-background border-input text-xs h-8"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70">
                      Leave empty for immediate and permanent placement.
                    </p>
                  </div>
                </div>
            </AdvancedSettingsAccordion>

            <SaveBar 
              onSave={handleSave}
              isSaving={conductMutation.isPending}
              isDisabled={!selectedContentId || conductMutation.isPending}
              label="Save Changes"
            />
          </ControlPanel>
        </EditorialLayout>
      </SheetContent>

      <VideoSlotEditor
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={handleCreateVideo}
      />

      {editingPost && (
        <VideoSlotEditor
          open={!!editingPost}
          onOpenChange={(open) => !open && setEditingPost(null)}
          initialUrl={editingPost.youtube_id ? `https://www.youtube.com/watch?v=${editingPost.youtube_id}` : ""}
          initialTitle={editingPost.title}
          initialDescription={editingPost.subtitle || ""}
          onSave={handleUpdateVideo}
        />
      )}
    </Sheet>
  );
}
