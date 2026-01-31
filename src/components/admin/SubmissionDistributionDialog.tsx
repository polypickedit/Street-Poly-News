import React, { useState, useEffect } from "react";
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

  const fetchDistributions = async () => {
    if (!submissionId) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (k: string, v: string) => Promise<{data: unknown, error: unknown}> } } })
        .from("submission_distribution")
        .select(`
          *,
          media_outlets (
            name,
            website_url
          )
        `)
        .eq("submission_id", submissionId);

      if (error) throw error;
      setDistributions((data as unknown as DistributionStatus[]) || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error fetching distribution",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchDistributions();
    }
  }, [isOpen, submissionId]);

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
    pending: <Clock className="w-4 h-4 text-blue-400" />,
    published: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    rejected: <XCircle className="w-4 h-4 text-red-400" />,
    scheduled: <Clock className="w-4 h-4 text-amber-400" />,
  };

  const statusColors = {
    pending: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-400 border-red-500/30",
    scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{submissionTitle}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Syndication & Distribution Status
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
              <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">No distribution targets selected for this submission.</p>
              <Button variant="outline" className="mt-4 border-slate-700 hover:bg-slate-900">
                Assign Outlets
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {distributions.map((dist) => (
                <div 
                  key={dist.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold">{dist.media_outlets.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] uppercase tracking-tighter gap-1 ${statusColors[dist.status]}`}>
                          {statusIcons[dist.status]}
                          {dist.status}
                        </Badge>
                        {dist.published_at && (
                          <span className="text-[10px] text-slate-500">
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
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        onClick={() => window.open(dist.published_url!, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {dist.status === 'pending' && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        onClick={() => updateStatus(dist.id, 'published', 'https://streetpoly.com/news/demo')}
                      >
                        <Send className="w-3 h-3" /> Publish
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-300">
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
