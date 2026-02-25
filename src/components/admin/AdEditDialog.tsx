import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaLibraryDialog } from "./MediaLibraryDialog";
import { Edit, Image as ImageIcon, Link as LinkIcon, Type } from "lucide-react";
import newMusicMondaysSideBanner from "@/assets/New Music Monday Side banner ad.png";
import { supabase } from "@/integrations/supabase/client";
import stripClubSlotsAd from "@/assets/Strip_Club_Slots_ad-removebg-preview.png";
import streetPolyMerchAd from "@/assets/StreetPolyMerch_Ad.jpeg";
import donTripAd from "@/assets/Don Trip ad.jpeg";
import { Promo } from "@/types/promo";

interface AdEditDialogProps {
  trigger?: React.ReactNode;
  initialData?: Partial<Promo>;
  onSave: (data: { imageUrl: string; link: string; title: string; subtitle: string }) => void;
}

interface UploadedFile {
  name: string;
  id: string;
  metadata: Record<string, unknown>;
}

export function AdEditDialog({ trigger, initialData, onSave }: AdEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData?.image || "");
  const [link, setLink] = useState(initialData?.link || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const availableAds = [
    {
      id: "new-music-monday",
      label: "New Music Mondays",
      imageUrl: newMusicMondaysSideBanner,
    },
    {
      id: "strip-club-slots",
      label: "Strip Club Slots",
      imageUrl: stripClubSlotsAd,
    },
    {
      id: "streetpoly-merch",
      label: "StreetPoly Merch",
      imageUrl: streetPolyMerchAd,
    },
    {
      id: "don-trip",
      label: "Don Trip",
      imageUrl: donTripAd,
    },
  ];

  useEffect(() => {
    if (!isOpen) return;

    setImageUrl(initialData?.image || "");
    setLink(initialData?.link || "");
    setTitle(initialData?.title || "");
    setSubtitle(initialData?.subtitle || "");
  }, [isOpen, initialData?.image, initialData?.link, initialData?.title, initialData?.subtitle]);

  const fetchUploaded = async () => {
    setLoadingUploads(true);
    try {
      const { data, error } = await supabase.storage.from("media").list("uploads", {
        limit: 60,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) {
        console.error("Failed to fetch uploaded files:", error);
        return;
      }
      setUploadedFiles((data || []) as UploadedFile[]);
    } finally {
      setLoadingUploads(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchUploaded();
  }, [isOpen]);

  const handleSave = () => {
    onSave({
      imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
      link,
      title,
      subtitle
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display uppercase tracking-widest">Edit Ad Slot</DialogTitle>
          <DialogDescription>
            Update ad creative, destination link, and optional copy.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Image Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ad Image</Label>
            <div className="flex flex-col gap-4">
              {imageUrl ? (
                <div className="relative aspect-[260/260] w-full rounded-lg overflow-hidden border border-border bg-muted">
                  <img 
                    src={typeof imageUrl === 'string' ? imageUrl : ''} 
                    alt="Ad Preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <MediaLibraryDialog 
                      trigger={<Button variant="secondary" size="sm">Change Image</Button>}
                      onSelect={setImageUrl}
                      accept="image/*"
                    />
                  </div>
                </div>
              ) : (
                <div className="aspect-[260/100] w-full rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 bg-muted/5">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                  <MediaLibraryDialog 
                    trigger={<Button variant="outline" size="sm">Select Image</Button>}
                    onSelect={setImageUrl}
                    accept="image/*"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Ads</Label>
            <div className="grid grid-cols-2 gap-3">
              {availableAds.map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => setImageUrl(ad.imageUrl)}
                  className="group rounded-lg border border-border bg-muted/40 overflow-hidden text-left"
                >
                  <div className="aspect-[16/9] bg-muted">
                    <img src={ad.imageUrl} alt={ad.label} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                    {ad.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uploaded Ads</Label>
              <Button variant="ghost" size="sm" onClick={fetchUploaded} disabled={loadingUploads}>
                {loadingUploads ? "Loading..." : "Refresh"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {uploadedFiles
                .filter((file) => {
                  const mimetype = (file.metadata as { mimetype?: string })?.mimetype;
                  return mimetype?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                })
                .map((file) => {
                  const publicUrl = supabase.storage.from("media").getPublicUrl(`uploads/${file.name}`).data?.publicUrl;
                  if (!publicUrl) {
                    console.error("Failed to get public URL for uploaded file:", file.name);
                    return null;
                  }
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setImageUrl(publicUrl)}
                      className="group rounded-lg border border-border bg-muted/40 overflow-hidden text-left"
                    >
                      <div className="aspect-[16/9] bg-muted">
                        <img src={publicUrl} alt={file.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                        {file.name}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="link" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destination URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="link"
                placeholder="https://example.com/promo"
                className="pl-9"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title (Optional)</Label>
            <div className="relative">
              <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                placeholder="Summer Sale"
                className="pl-9"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtitle (Optional)</Label>
            <Input
              id="subtitle"
              placeholder="Limited time offer"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-dem text-white hover:bg-dem/90">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
