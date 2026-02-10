import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: string;
}

export function ContactSubmissions() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async (signal?: AbortSignal) => {
    try {
      const query = (supabase as SupabaseClient)
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false }) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: ContactSubmission[] | null; error: unknown }> };

      const { data, error } = await query.abortSignal(signal);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      toast({
        title: "Error",
        description: "Failed to load contact submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSubmissions(controller.signal);
    return () => controller.abort();
  }, [fetchSubmissions]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await (supabase as SupabaseClient)
        .from("contact_submissions")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setSubmissions(submissions.map(sub => 
        sub.id === id ? { ...sub, status: newStatus } : sub
      ));
      
      toast({
        title: "Status updated",
        description: "Submission status has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;

    try {
      const { error } = await (supabase as SupabaseClient)
        .from("contact_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubmissions(submissions.filter(sub => sub.id !== id));
      
      toast({
        title: "Deleted",
        description: "Submission has been deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete submission",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-dem" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black font-display text-dem uppercase tracking-tight">Contact Submissions</h2>
        <span className="text-sm text-muted-foreground font-bold">
          {submissions.length} total messages
        </span>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Date</TableHead>
              <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">From</TableHead>
              <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Subject</TableHead>
              <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Status</TableHead>
              <TableHead className="text-right text-muted-foreground font-black uppercase tracking-widest text-[10px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow className="hover:bg-transparent border-border">
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-bold">
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id} className="hover:bg-muted/50 border-border">
                  <TableCell className="whitespace-nowrap text-foreground font-bold">
                    {format(new Date(submission.created_at), "MMM d, yyyy")}
                    <div className="text-[10px] text-muted-foreground font-medium uppercase">
                      {format(new Date(submission.created_at), "h:mm a")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-black text-dem uppercase text-sm">{submission.name}</div>
                    <div className="text-xs text-muted-foreground font-bold">{submission.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-black mb-1 text-foreground text-sm uppercase">{submission.subject}</div>
                    <p className="text-xs text-muted-foreground font-medium line-clamp-2 max-w-[300px]">
                      {submission.message}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={submission.status}
                      onValueChange={(value) => updateStatus(submission.id, value)}
                    >
                      <SelectTrigger className="w-[120px] h-8 bg-muted border-border text-foreground font-black uppercase text-[10px] tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="new" className="font-bold uppercase text-[10px] tracking-widest">New</SelectItem>
                        <SelectItem value="read" className="font-bold uppercase text-[10px] tracking-widest">Read</SelectItem>
                        <SelectItem value="replied" className="font-bold uppercase text-[10px] tracking-widest">Replied</SelectItem>
                        <SelectItem value="archived" className="font-bold uppercase text-[10px] tracking-widest">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-dem border-dem/20 hover:bg-dem/10"
                        asChild
                      >
                        <a href={`mailto:${submission.email}?subject=Re: ${submission.subject}`}>
                          <Mail className="w-4 h-4 mr-2" />
                          Reply
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-rep hover:bg-rep/90"
                        onClick={() => deleteSubmission(submission.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
