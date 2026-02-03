import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Share2, Globe, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OutletEditDialog } from "./OutletEditDialog";

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
  const { toast } = useToast();

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { order: (o: string) => Promise<{data: unknown, error: unknown}> } } })
        .from("media_outlets")
        .select("*")
        .order("name");

      if (error) throw error;
      setOutlets((data as MediaOutlet[]) || []);
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
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as unknown as { from: (t: string) => { update: (v: unknown) => { eq: (k: string, v: string) => Promise<{error: unknown}> } } })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-dem" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">Syndication Network</h3>
          <p className="text-xs text-white/50 mt-1">Manage distribution targets and outlet requirements.</p>
        </div>
        <Button className="bg-dem hover:bg-dem/90 text-white gap-2">
          <Plus className="w-4 h-4" />
          Add Outlet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {outlets.map((outlet) => (
          <Card key={outlet.id} className="bg-card border-white/10 hover:border-white/20 transition-all overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded bg-dem/20 flex items-center justify-center group-hover:bg-dem/30 transition-colors">
                  <Share2 className="w-6 h-6 text-dem" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 font-medium uppercase tracking-tighter">
                    {outlet.active ? "Active" : "Inactive"}
                  </span>
                  <Switch 
                    checked={outlet.active} 
                    onCheckedChange={() => toggleActive(outlet.id, outlet.active)}
                  />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg font-bold text-white">{outlet.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] bg-dem/10 border-dem/30 text-dem uppercase tracking-tight">
                  {outlet.outlet_type}
                </Badge>
                {outlet.requires_review ? (
                  <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/60 uppercase tracking-tight gap-1">
                    <AlertCircle className="w-2 h-2" /> Review Required
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-dem/20 border-dem/30 text-dem uppercase tracking-tight gap-1">
                    <CheckCircle2 className="w-2 h-2" /> Auto-Accept
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/40 line-clamp-2 min-h-[40px]">
                {outlet.description || "No description provided."}
              </p>
              
              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4 mt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white/50">
                    <FileText className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Types</span>
                  </div>
                  <p className="text-[10px] font-semibold text-white/70 truncate">
                    {outlet.accepted_content_types.join(", ")}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white/50">
                    <Globe className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Words</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{outlet.preferred_word_count || "N/A"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end gap-2 text-white/50">
                    <span className="text-[10px] uppercase font-bold tracking-tight">Price</span>
                  </div>
                  <p className="text-sm font-bold text-dem">${(outlet.price_cents / 100).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white border-none"
                  onClick={() => setEditDialog({ isOpen: true, outlet })}
                >
                  Edit Profile
                </Button>
                {outlet.website_url && (
                  <Button 
                    variant="ghost" 
                    className="text-xs text-dem hover:text-dem/80 hover:bg-dem/10"
                    onClick={() => window.open(outlet.website_url!, '_blank')}
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
        isOpen={editDialog.isOpen}
        onClose={() => setEditDialog({ ...editDialog, isOpen: false })}
        outlet={editDialog.outlet}
        onSuccess={fetchOutlets}
      />
    </div>
  );
};
