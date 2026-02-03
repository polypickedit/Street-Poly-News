import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExternalLink, Check, X, Clock, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SubmissionDistributionDialog } from "./SubmissionDistributionDialog";

type SubmissionStatus = "pending" | "approved" | "declined" | "archived";
type PaymentStatus = "paid" | "unpaid" | "refunded";

type SubmissionRow = {
  id: string;
  artist_id: string;
  slot_id: string | null;
  track_title: string;
  artist_name: string;
  spotify_track_url: string;
  release_date: string;
  genre: string;
  mood: string;
  bpm: number | null;
  status: SubmissionStatus;
  payment_status: PaymentStatus;
  notes_internal: string | null;
  feedback_artist: string | null;
  created_at: string;
  reviewed_at: string | null;
  artists: {
    name: string;
    email: string;
  } | null;
  slots: {
    name: string;
    price: number;
  } | null;
};

type SubmissionFilter = "all" | SubmissionStatus;

const statusBadgeColor: Record<SubmissionStatus, string> = {
  pending: "text-dem bg-dem/10 border-dem/30",
  approved: "text-white bg-dem border-dem/30",
  declined: "text-rep bg-rep/10 border-rep/30",
  archived: "text-white/40 bg-white/5 border-white/10",
};

const paymentBadgeColor: Record<PaymentStatus, string> = {
  paid: "text-white bg-dem border-dem/30",
  unpaid: "text-rep bg-rep/10 border-rep/30",
  refunded: "text-white/60 bg-white/5 border-white/10",
};

export const SubmissionQueue = () => {
  const [filter, setFilter] = useState<SubmissionFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [distributionDialog, setDistributionDialog] = useState<{ isOpen: boolean; submissionId: string | null; title: string }>({
    isOpen: false,
    submissionId: null,
    title: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: submissions = [], isLoading } = useQuery<SubmissionRow[]>({
    queryKey: ["submissions", filter],
    queryFn: async () => {
      let query = supabase
        .from("submissions")
        .select("*, artists ( name, email ), slots ( name, price )")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SubmissionRow[];
    },
  });

  const updateStatus = async (id: string, newStatus: Exclude<SubmissionFilter, "all">) => {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      // Log the admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_actions").insert({
          admin_user_id: user.id,
          action_type: newStatus === "approved" ? "approve_submission" : "decline_submission",
          target_type: "submission",
          target_id: id,
          metadata: { status: newStatus }
        });
      }

      toast({
        title: "Status updated",
        description: `Submission marked as ${newStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    } catch (error) {
      toast({
        title: "Unable to update status",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const renderStatusBadge = (status: SubmissionRow["status"]) => (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border ${statusBadgeColor[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );

  const renderPaymentBadge = (paymentStatus: SubmissionRow["payment_status"]) => (
    <Badge className={`text-xs font-semibold rounded-full border ${paymentBadgeColor[paymentStatus]}`}>
      {paymentStatus.toUpperCase()}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2">
          {["all", "pending", "approved", "declined", "archived"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "secondary" : "ghost"}
              className="text-xs uppercase tracking-[0.3em]"
              onClick={() => setFilter(status as SubmissionFilter)}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
        <div className="text-sm text-white/40 italic">
          Showing {submissions.length} results
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-card/80">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/40">Submission</TableHead>
              <TableHead className="text-white/40">Slot</TableHead>
              <TableHead className="text-white/40">Payment</TableHead>
              <TableHead className="text-white/40">Status</TableHead>
              <TableHead className="text-white/40">Submitted</TableHead>
              <TableHead className="text-right text-white/40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-dem" />
                  </div>
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No submissions match this filter.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-white/40" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{submission.track_title}</div>
                        <div className="text-xs text-white/40">{submission.artist_name}</div>
                        {submission.artists && (
                          <div className="text-xs text-white/30">
                            {submission.artists.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-white">{submission.slots?.name || submission.genre}</span>
                      <span className="text-xs text-dem font-mono">
                        ${submission.slots?.price ? submission.slots.price.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{renderPaymentBadge(submission.payment_status)}</TableCell>
                  <TableCell>{renderStatusBadge(submission.status)}</TableCell>
                  <TableCell className="text-right text-sm text-white/40">
                    {format(new Date(submission.created_at), "MMM d, yyyy")}
                    <div className="text-xs text-white/30">
                      {format(new Date(submission.created_at), "h:mm a")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-dem hover:text-dem/80 hover:bg-dem/10"
                        onClick={() =>
                          setDistributionDialog({
                            isOpen: true,
                            submissionId: submission.id,
                            title: submission.track_title,
                          })
                        }
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-dem hover:text-dem/80 hover:bg-dem/10"
                        onClick={() => {
                          if (submission.payment_status !== "paid") {
                            toast({
                              title: "Payment required",
                              description: "Cannot approve an unpaid submission.",
                              variant: "destructive",
                            });
                            return;
                          }
                          updateStatus(submission.id, "approved");
                        }}
                        disabled={busyId === submission.id || submission.status === "approved" || submission.payment_status !== "paid"}
                        title={submission.payment_status !== "paid" ? "Payment required" : "Approve submission"}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rep hover:text-rep/80 hover:bg-rep/10"
                        onClick={() => updateStatus(submission.id, "declined")}
                        disabled={busyId === submission.id || submission.status === "declined"}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white">
                            <Clock className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-white/10 text-white">
                          <DropdownMenuItem asChild className="hover:bg-white/5">
                            <a
                              href={submission.spotify_track_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Track
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/5">Add internal note</DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-white/5 text-rep"
                            onClick={() => updateStatus(submission.id, "archived")}
                          >
                            Archive submission
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <SubmissionDistributionDialog
        isOpen={distributionDialog.isOpen}
        onClose={() =>
          setDistributionDialog((prev) => ({ ...prev, isOpen: false }))
        }
        submissionId={distributionDialog.submissionId}
        submissionTitle={distributionDialog.title}
      />
    </div>
  );
};
