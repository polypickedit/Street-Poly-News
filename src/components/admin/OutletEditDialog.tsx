import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface OutletEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  outlet: {
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
  } | null;
  onSuccess: () => void;
}

export const OutletEditDialog = ({
  isOpen,
  onClose,
  outlet,
  onSuccess,
}: OutletEditDialogProps) => {
  console.log("OutletEditDialog rendering, isOpen:", isOpen);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<'blog' | 'news' | 'playlist' | 'community' | 'social'>('blog');
  const [price, setPrice] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [requiresReview, setRequiresReview] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [acceptedContentTypes, setAcceptedContentTypes] = useState<string[]>(["music", "story"]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (outlet) {
      setName(outlet.name);
      setSlug(outlet.slug);
      setDescription(outlet.description || "");
      setType(outlet.outlet_type);
      setPrice((outlet.price_cents / 100).toString());
      setWordCount(outlet.preferred_word_count?.toString() || "");
      setRequiresReview(outlet.requires_review);
      setWebsiteUrl(outlet.website_url || "");
      setLogoUrl(outlet.logo_url || "");
      setIsActive(outlet.active);
      setAcceptedContentTypes(outlet.accepted_content_types || ["music", "story"]);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setType('blog');
      setPrice("0");
      setWordCount("");
      setRequiresReview(true);
      setWebsiteUrl("");
      setLogoUrl("");
      setIsActive(true);
      setAcceptedContentTypes(["music", "story"]);
    }
  }, [outlet, isOpen]);

  // Auto-generate slug from name in create mode
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!outlet) {
      setSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  };

  const handleSave = async () => {
    if (!name || !slug) {
      toast({
        title: "Missing fields",
        description: "Name and Slug are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const priceCents = Math.round(parseFloat(price || "0") * 100);
      const count = wordCount ? parseInt(wordCount) : null;

      const outletData = {
        name,
        slug,
        description,
        outlet_type: type,
        price_cents: priceCents,
        preferred_word_count: count,
        requires_review: requiresReview,
        website_url: websiteUrl,
        logo_url: logoUrl,
        active: isActive,
        accepted_content_types: acceptedContentTypes,
      };

      let error;
      if (outlet) {
        const { error: updateError } = await supabase
          .from("media_outlets")
          .update(outletData)
          .eq("id", outlet.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("media_outlets")
          .insert([outletData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: outlet ? "Outlet updated" : "Outlet created",
        description: `${name} has been ${outlet ? "updated" : "created"} successfully.`,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-black uppercase tracking-widest">
            {outlet ? `Edit Outlet: ${outlet.name}` : "Add New Media Outlet"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Urban Beats"
                className="bg-muted border-border text-foreground focus:border-dem"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Types</Label>
              <Select 
                value={type} 
                onValueChange={(v: 'blog' | 'news' | 'playlist' | 'community' | 'social') => setType(v)}
              >
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="playlist">Playlist</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slug" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">URL Slug</Label>
              <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-tighter">Auto-generated</span>
            </div>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. urban-beats"
              className="bg-muted border-border text-foreground focus:border-dem"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the outlet's focus..."
              className="bg-muted border-border text-foreground focus:border-dem min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-muted border-border text-foreground focus:border-dem"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wordCount" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Preferred Word Count</Label>
              <Input
                id="wordCount"
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(e.target.value)}
                placeholder="Optional"
                className="bg-muted border-border text-foreground focus:border-dem"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Accepted Content Types</Label>
            <div className="flex flex-wrap gap-2">
              {['music', 'story', 'announcement'].map((ct) => (
                <Badge 
                  key={ct}
                  variant={acceptedContentTypes.includes(ct) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer uppercase text-[10px] tracking-tight",
                    acceptedContentTypes.includes(ct) ? "bg-dem text-white" : "text-muted-foreground"
                  )}
                  onClick={() => {
                    if (acceptedContentTypes.includes(ct)) {
                      setAcceptedContentTypes(acceptedContentTypes.filter(t => t !== ct));
                    } else {
                      setAcceptedContentTypes([...acceptedContentTypes, ct]);
                    }
                  }}
                >
                  {ct}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="websiteUrl" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Website URL</Label>
              <Input
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="bg-muted border-border text-foreground focus:border-dem"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logoUrl" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="bg-muted border-border text-foreground focus:border-dem"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Requires Review</Label>
                <p className="text-[10px] text-muted-foreground">Manual approval required</p>
              </div>
              <Switch checked={requiresReview} onCheckedChange={setRequiresReview} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Active Status</Label>
                <p className="text-[10px] text-muted-foreground">Visible to users</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="bg-muted border-border text-foreground hover:bg-muted/80 uppercase font-bold text-xs">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-dem hover:bg-dem/90 text-white uppercase font-black">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {outlet ? "Save Changes" : "Create Outlet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
