import React, { useState } from "react";
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
import { SupabaseClient } from '@supabase/supabase-js';
import { ContentType, ContentPlacement } from "@/types/cms";
import { Post } from "@/hooks/usePosts";
import { Loader2, Save, History, Smartphone, Monitor, CheckCircle2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

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
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [deviceScope, setDeviceScope] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  // 1. Fetch current placement
  const { data: currentPlacement } = useQuery({
    queryKey: ["slot-content", slotKey],
    queryFn: async ({ signal }) => {
      // Use SupabaseClient cast to bypass deep type recursion
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

  // 2. Fetch available content (Featured Posts)
  const { data: availablePosts, isLoading: loadingPosts } = useQuery({
    queryKey: ["available-posts", accepts],
    queryFn: async ({ signal }) => {
      const query = supabase
        .from("posts")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(20)
        .abortSignal(signal);

      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
    enabled: isOpen,
  });

  // 3. Mutation to update placement
  const conductMutation = useMutation({
    mutationFn: async ({ contentId, reason }: { contentId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Editorial Pacing: Artificial delay to give the change "weight"
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await (supabase as SupabaseClient)
        .from("content_placements")
        .insert({
          slot_key: slotKey,
          content_type: "video", // TODO: Detect from post
          content_id: contentId,
          priority: (currentPlacement?.priority || 0) + 1,
          updated_by: user?.id,
          device_scope: deviceScope,
          starts_at: startsAt || null,
          ends_at: endsAt || null,
          metadata: { reason } // Passed to trigger for admin_actions logging
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slot-content", slotKey] });
      toast.success(`Slot ${slotKey} updated successfully!`);
      setReason(""); // Reset reason
      onClose();
    },
    onError: (err) => {
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
      toast.success(`Slot ${slotKey} reverted.`);
      onClose();
    },
  });

  const handleSave = () => {
    if (selectedContentId) {
      conductMutation.mutate({ contentId: selectedContentId, reason });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md border-border text-foreground overflow-y-auto">
        <SheetHeader className="mb-6">
          <Badge variant="outline" className="w-fit mb-2 border-dem text-dem">
            Conducting Slot
          </Badge>
          <SheetTitle className="text-2xl font-display">{slotKey}</SheetTitle>
          <SheetDescription className="text-muted-foreground font-body">
            Assign content to this area of the site.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          {/* Current Content Info */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                <Info className="w-3 h-3" /> Current Winner
              </h3>
              {currentPlacement && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-rep hover:text-rep hover:bg-rep/10 uppercase tracking-widest"
                  onClick={() => revertMutation.mutate()}
                  disabled={revertMutation.isPending}
                >
                  <History className="w-3 h-3 mr-1" /> Revert
                </Button>
              )}
            </div>
            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              {currentPlacement ? (
                <div>
                  <p className="text-sm font-body text-muted-foreground">
                    Type: <span className="text-foreground font-bold">{currentPlacement.content_type}</span>
                  </p>
                  <p className="text-sm font-body text-muted-foreground">
                    ID: <span className="text-foreground font-mono">{currentPlacement.content_id}</span>
                  </p>
                   <p className="text-xs text-muted-foreground mt-2 font-mono">
                    Placed: {new Date(currentPlacement.created_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Static Fallback (No active placements)</p>
              )}
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Content Picker */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">
              Swap Content
            </h3>
            {loadingPosts ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-dem" />
              </div>
            ) : (
              <div className="grid gap-2">
                {availablePosts?.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedContentId(post.id.toString())}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border transition-all text-left",
                      selectedContentId === post.id.toString()
                        ? "bg-dem/10 border-dem shadow-sm"
                        : "bg-muted/50 border-border hover:border-muted-foreground/30 hover:bg-muted"
                    )}
                  >
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                      {post.thumbnail_url && (
                        <img 
                          src={post.thumbnail_url} 
                          alt={post.title} 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display truncate leading-tight">{post.title}</p>
                      <p className="text-xs text-muted-foreground font-body uppercase mt-1">{post.content_type}</p>
                    </div>
                    {selectedContentId === post.id.toString() && (
                      <CheckCircle2 className="w-4 h-4 text-dem" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Intentionality Logging */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">
              Intentionality Log
            </h3>
            <Input
              placeholder="Reason for change (optional)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus:border-dem transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              Adding a reason turns logs into institutional memory.
            </p>
          </section>

          {/* Advanced Targeting */}
          <section className="space-y-6 pt-2">
            <Separator className="bg-border" />
            
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                <Monitor className="w-3 h-3" /> Target Audience
              </h3>
              <div className="flex gap-2">
                {(['all', 'mobile', 'desktop'] as const).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setDeviceScope(scope)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 p-2 rounded border transition-all text-xs font-bold uppercase",
                      deviceScope === scope
                        ? "bg-dem/10 border-dem text-dem"
                        : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {scope === 'mobile' && <Smartphone className="w-3 h-3" />}
                    {scope === 'desktop' && <Monitor className="w-3 h-3" />}
                    {scope}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Temporal Scheduling
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Starts At</label>
                  <Input 
                    type="datetime-local" 
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="bg-background border-input text-xs h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Ends At</label>
                  <Input 
                    type="datetime-local" 
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="bg-background border-input text-xs h-8"
                  />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground/40 italic">Leave empty for immediate / permanent placement.</p>
            </div>
          </section>

          {/* Action Footer */}
          <div className="sticky bottom-0 bg-background pt-4 pb-2">
            <Button 
              className="w-full bg-dem hover:bg-dem/90 text-white font-bold h-12"
              disabled={!selectedContentId || conductMutation.isPending}
              onClick={handleSave}
            >
              {conductMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Commit Change
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1 uppercase tracking-tighter">
              <History className="w-3 h-3" /> This action will be logged.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
