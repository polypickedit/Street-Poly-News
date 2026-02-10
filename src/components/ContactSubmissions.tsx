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

  const fetchSubmissions = useCallback(async () => {
    try {
      const { data, error } = await (supabase as SupabaseClient)
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions((data as unknown as ContactSubmission[]) || []);
    } catch (error) {
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
    fetchSubmissions();
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
        <h2 className="text-2xl font-display text-white">Contact Submissions</h2>
        <span className="text-sm text-white/40">
          {submissions.length} total messages
        </span>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/10">
              <TableHead className="text-white/60">Date</TableHead>
              <TableHead className="text-white/60">From</TableHead>
              <TableHead className="text-white/60">Subject</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
              <TableHead className="text-right text-white/60">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow className="hover:bg-transparent border-white/10">
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id} className="hover:bg-white/5 border-white/10">
                  <TableCell className="whitespace-nowrap text-white">
                    {format(new Date(submission.created_at), "MMM d, yyyy")}
                    <div className="text-xs text-white/40">
                      {format(new Date(submission.created_at), "h:mm a")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-white">{submission.name}</div>
                    <div className="text-sm text-white/40">{submission.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium mb-1 text-white">{submission.subject}</div>
                    <p className="text-sm text-white/40 line-clamp-2 max-w-[300px]">
                      {submission.message}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={submission.status}
                      onValueChange={(value) => updateStatus(submission.id, value)}
                    >
                      <SelectTrigger className="w-[120px] h-8 bg-black/40 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
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
