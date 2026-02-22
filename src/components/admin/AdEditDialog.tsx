import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaLibraryDialog } from "./MediaLibraryDialog";
import { Edit, Image as ImageIcon, Link as LinkIcon, Type } from "lucide-react";
import { Promo } from "@/types/promo";

interface AdEditDialogProps {
  trigger?: React.ReactNode;
  initialData?: Partial<Promo>;
  onSave: (data: { imageUrl: string; link: string; title: string; subtitle: string }) => void;
}

export function AdEditDialog({ trigger, initialData, onSave }: AdEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData?.image || "");
  const [link, setLink] = useState(initialData?.link || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");

  useEffect(() => {
    if (!isOpen) return;

    setImageUrl(initialData?.image || "");
    setLink(initialData?.link || "");
    setTitle(initialData?.title || "");
    setSubtitle(initialData?.subtitle || "");
  }, [isOpen, initialData?.image, initialData?.link, initialData?.title, initialData?.subtitle]);

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
