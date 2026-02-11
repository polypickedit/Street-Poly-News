import React, { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Share2, Globe, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OutletEditDialog } from "./OutletEditDialog";
import { ConductDrawer } from "./ConductDrawer";
import { ContentType } from "@/types/cms";
import { cn } from "@/lib/utils";

interface MediaOutlet {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  outlet_type: 'blog' | 'news' | 'playlist' | 'community' | 'social';
  accepted_content_types: string[];
  preferred_word_count: number | null;
  requires_review: boolean;
  website_url: string | null;
  logo_url: string | null;
  active: boolean;
  price_cents: number;
}

export const OutletManager = () => {
  const [outlets, setOutlets] = useState<MediaOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    outlet: MediaOutlet | null;
  }>({ isOpen: false, outlet: null });
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Selection and Conduct Drawer State (Option B)
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const clickTimeout = useRef<number | null>(null);
  
  const { toast } = useToast();

  const handleOutletClick = (outlet: MediaOutlet) => {
    // Selection always happens on first click
    setSelectedOutletId(outlet.id);

    if (clickTimeout.current) {
      // Confirmed double-click
      window.clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      setEditDialog({ isOpen: true, outlet });
    } else {
      // Start double-click timer
      clickTimeout.current = window.setTimeout(() => {
        clickTimeout.current = null;
      }, 250) as unknown as number;
    }
  };

  const fetchOutlets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("media_outlets")
        .select("*")
        .order("name");

      if (error) throw error;
      setOutlets((data as unknown as MediaOutlet[]) || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error fetching outlets",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("media_outlets")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      
      setOutlets(prev => prev.map(o => o.id === id ? { ...o, active: !currentStatus } : o));
      
      toast({
        title: currentStatus ? "Outlet deactivated" : "Outlet activated",
        duration: 2000,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const selectedOutlet = outlets.find(o => o.id === selectedOutletId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-dem" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Syndication Network</h3>
          <p className="text-xs text-muted-foreground/80 mt-1">Manage distribution targets and outlet requirements.</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          data-conduction-toggle
          className="inline-flex items-center justify-center rounded-md bg-dem hover:bg-dem/90 text-white px-4 py-2 gap-2 font-black uppercase transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Outlet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {outlets.map((outlet) => (
          <Card 
            key={outlet.id} 
            className={cn(
              "bg-card border-border hover:border-muted-foreground/30 transition-all overflow-hidden group cursor-pointer",
              selectedOutletId === outlet.id && "ring-2 ring-dem border-dem shadow-sm"
            )}
            onClick={() => handleOutletClick(outlet)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded bg-dem/10 flex items-center justify-center group-hover:bg-dem/20 transition-colors">
                  <Share2 className="w-6 h-6 text-dem" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    {outlet.active ? "Active" : "Inactive"}
                  </span>
                  <Switch 
                    checked={outlet.active} 
                    onCheckedChange={(checked) => {
                      toggleActive(outlet.id, outlet.active);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg font-black text-dem uppercase">{outlet.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-dem/10 border-dem/30 text-dem uppercase tracking-tight">
                  {outlet.outlet_type}
                </Badge>
                {outlet.requires_review ? (
                  <Badge variant="outline" className="text-xs bg-muted border-border text-muted-foreground uppercase tracking-tight gap-1">
                    <AlertCircle className="w-2 h-2" /> Review Required
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-dem/10 border-dem/30 text-dem uppercase tracking-tight gap-1">
                    <CheckCircle2 className="w-2 h-2" /> Auto-Accept
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                {outlet.description || "No description provided."}
              </p>
              
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 mt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <FileText className="w-3 h-3" />
                    <span className="text-xs uppercase font-bold tracking-tight">Types</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground truncate">
                    {outlet.accepted_content_types.join(", ")}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-dem/70">
                    <Globe className="w-3 h-3" />
                    <span className="text-xs uppercase font-bold tracking-tight">Words</span>
                  </div>
                  <p className="text-sm font-black text-dem uppercase">{outlet.preferred_word_count || "N/A"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end gap-2 text-muted-foreground/70">
                    <span className="text-xs uppercase font-bold tracking-tight">Price</span>
                  </div>
                  <p className="text-sm font-bold text-dem">${(outlet.price_cents / 100).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs bg-muted hover:bg-muted/80 text-dem border-border font-black uppercase"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawerOpen(true);
                  }}
                >
                  Conduct Slot
                </Button>
                {outlet.website_url && (
                  <Button 
                    variant="ghost" 
                    className="text-xs text-dem hover:text-dem/80 hover:bg-dem/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(outlet.website_url!, '_blank');
                    }}
                  >
                    Visit Site
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <OutletEditDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        outlet={null}
        onSuccess={fetchOutlets}
      />

      <OutletEditDialog
        isOpen={editDialog.isOpen}
        onClose={() => setEditDialog({ ...editDialog, isOpen: false })}
        outlet={editDialog.outlet}
        onSuccess={fetchOutlets}
      />

      {selectedOutlet && (
        <ConductDrawer
          slotKey={selectedOutlet.slug}
          accepts={selectedOutlet.accepted_content_types as ContentType[]}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
};
