import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Send,
  Loader2,
  Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DistributionStatus {
  id: string;
  outlet_id: string;
  status: 'pending' | 'published' | 'rejected' | 'scheduled';
  published_url: string | null;
  published_at: string | null;
  media_outlets: {
    name: string;
    website_url: string | null;
  };
}

interface SubmissionDistributionDialogProps {
  submissionId: string | null;
  submissionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SubmissionDistributionDialog = ({
  submissionId,
  submissionTitle,
  isOpen,
  onClose
}: SubmissionDistributionDialogProps) => {
  const [distributions, setDistributions] = useState<DistributionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDistributions = useCallback(async (signal?: AbortSignal) => {
    if (!submissionId) return;
    
    setLoading(true);
    try {
      type SupabaseQuery = {
        abortSignal: (s: AbortSignal) => SupabaseQuery;
        eq: (k: string, v: string) => Promise<{ data: unknown; error: unknown }>;
      };

      let query = (supabase as unknown as { from: (t: string) => { select: (s: string) => SupabaseQuery } })
        .from("submission_distribution")
        .select(`
          *,
          media_outlets (
            name,
            website_url
          )
        `);

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query.eq("submission_id", submissionId);

      if (error) throw error;
      setDistributions((data as unknown as DistributionStatus[]) || []);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error fetching distribution",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [submissionId, toast]);

  useEffect(() => {
    const controller = new AbortController();
    if (isOpen && submissionId) {
      fetchDistributions(controller.signal);
    }
    return () => controller.abort();
  }, [isOpen, submissionId, fetchDistributions]);

  const updateStatus = async (distId: string, newStatus: DistributionStatus['status'], url?: string) => {
    try {
      const { error } = await (supabase as unknown as { from: (t: string) => { update: (v: unknown) => { eq: (k: string, v: string) => Promise<{error: unknown}> } } })
        .from("submission_distribution")
        .update({ 
          status: newStatus,
          published_url: url || null,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        })
        .eq("id", distId);

      if (error) throw error;
      
      setDistributions(prev => prev.map(d => 
        d.id === distId ? { 
          ...d, 
          status: newStatus, 
          published_url: url || null,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        } : d
      ));

      toast({
        title: `Status updated to ${newStatus}`,
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

  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-dem" />,
    published: <CheckCircle2 className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4 text-rep" />,
    scheduled: <Clock className="w-4 h-4 text-muted-foreground/70" />,
  };

  const statusColors = {
    pending: "bg-dem/10 text-dem border-dem/30",
    published: "bg-dem text-white border-dem/30 font-bold",
    rejected: "bg-rep/10 text-rep border-rep/30",
    scheduled: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-border bg-card text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-dem/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-dem" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-dem uppercase">{submissionTitle}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Syndication & Distribution Status
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-dem" />
            </div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <Globe className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">No distribution targets selected for this submission.</p>
              <Button variant="outline" className="mt-4 border-border hover:bg-muted text-foreground">
                Assign Outlets
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {distributions.map((dist) => (
                <div 
                  key={dist.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:border-muted-foreground/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <p className="font-black text-dem uppercase">{dist.media_outlets.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs uppercase tracking-tighter gap-1 ${statusColors[dist.status]}`}>
                          {statusIcons[dist.status]}
                          {dist.status}
                        </Badge>
                        {dist.published_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(dist.published_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {dist.status === 'published' && dist.published_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-dem hover:text-dem/80 hover:bg-dem/10"
                        onClick={() => window.open(dist.published_url!, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {dist.status === 'pending' && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-dem hover:bg-dem/90 text-white gap-2 font-black uppercase"
                        onClick={() => updateStatus(dist.id, 'published', 'https://streetpoly.com/news/demo')}
                      >
                        <Send className="w-3 h-3" /> Publish
                      </Button>
                    )}

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground hover:bg-muted font-black uppercase tracking-widest text-[10px]"
                      onClick={() => toast({
                        title: "Coming Soon",
                        description: "Detailed distribution management is currently under development.",
                      })}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
