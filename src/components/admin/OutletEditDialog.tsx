import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OutletEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  outlet: {
    id: string;
    name: string;
    price_cents: number;
    preferred_word_count: number | null;
  } | null;
  onSuccess: () => void;
}

export const OutletEditDialog = ({
  isOpen,
  onClose,
  outlet,
  onSuccess,
}: OutletEditDialogProps) => {
  const [price, setPrice] = useState<string>("");
  const [wordCount, setWordCount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (outlet) {
      setPrice((outlet.price_cents / 100).toString());
      setWordCount(outlet.preferred_word_count?.toString() || "");
    }
  }, [outlet]);

  const handleSave = async () => {
    if (!outlet) return;

    setLoading(true);
    try {
      const priceCents = Math.round(parseFloat(price) * 100);
      const count = wordCount ? parseInt(wordCount) : null;

      const { error } = await (supabase as unknown as { from: (t: string) => { update: (v: unknown) => { eq: (k: string, v: string) => Promise<{error: unknown}> } } })
        .from("media_outlets")
        .update({
          price_cents: priceCents,
          preferred_word_count: count,
        })
        .eq("id", outlet.id);

      if (error) throw error;

      toast({
        title: "Outlet updated",
        description: `${outlet.name} has been updated successfully.`,
      });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Edit Outlet: {outlet?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wordCount">Preferred Word Count</Label>
            <Input
              id="wordCount"
              type="number"
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-700">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
