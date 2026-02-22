import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Copy, Trash2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

interface MediaLibraryDialogProps {
  onSelect?: (url: string) => void;
  trigger?: React.ReactNode;
}

export function MediaLibraryDialog({ onSelect, trigger }: MediaLibraryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from("media").list("uploads", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error) {
        console.error("Error fetching files:", error);
        toast.error("Failed to load media library");
      } else {
        setFiles(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      toast.success("File uploaded successfully");
      fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error((error as Error).message || "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (url: string) => {
    if (onSelect) {
      onSelect(url);
      setIsOpen(false);
    }
  };

  const copyUrl = (fileName: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(`uploads/${fileName}`);
    navigator.clipboard.writeText(data.publicUrl);
    toast.success("URL copied to clipboard");
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const { error } = await supabase.storage.from("media").remove([`uploads/${fileName}`]);
      if (error) throw error;
      toast.success("File deleted");
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
        <Button 
          variant="ghost" 
          size="sm" 
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground hover:bg-accent/20 transition-all mr-2 h-auto"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Media</span>
        </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-background/95 backdrop-blur-xl border-border">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-display uppercase tracking-widest">Media Library</DialogTitle>
          <Button variant="ghost" size="icon" onClick={fetchFiles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-dem/50 transition-colors bg-muted/5">
            <input
              type="file"
              id="media-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept="image/*,video/*"
            />
            <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center gap-2">
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-dem" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {uploading ? "Uploading..." : "Click to upload media"}
              </span>
            </label>
          </div>

          {/* File Grid */}
          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => {
                const publicUrl = supabase.storage.from("media").getPublicUrl(`uploads/${file.name}`).data.publicUrl;
                const mimetype = (file.metadata as { mimetype?: string })?.mimetype;
                const isImage = mimetype?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

                return (
                  <div key={file.id} className="group relative aspect-square bg-muted rounded-lg overflow-hidden border border-border hover:border-dem transition-colors">
                    {isImage ? (
                      <img src={publicUrl} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-xs text-muted-foreground break-all p-2">{file.name}</span>
                      </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      {onSelect && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-24 rounded-full bg-dem text-white hover:bg-dem/90 font-bold uppercase tracking-widest text-[10px]"
                          onClick={() => handleSelect(publicUrl)}
                        >
                          Select
                        </Button>
                      )}
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full"
                          onClick={() => copyUrl(file.name)}
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleDelete(file.name)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 truncate">
                      <p className="text-[10px] text-white truncate px-1">{file.name}</p>
                    </div>
                  </div>
                );
              })}
              {files.length === 0 && !loading && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No files found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
