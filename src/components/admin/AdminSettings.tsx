import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  ShieldCheck, 
  Save,
  Loader2,
  UserPlus
} from "lucide-react";

interface AdminUser {
  user_id: string;
  role: string;
  full_name: string | null;
  email?: string; // Note: email is harder to get without service role or custom function
}

export const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const { toast } = useToast();

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          roles (
            name
          ),
          profiles (
            full_name
          )
        `);

      if (error) throw error;

      const rawData = data as Array<{
        user_id: string;
        roles: { name: string } | null;
        profiles: { full_name: string | null } | null;
      }>;

      const formattedAdmins = rawData.map(item => ({
        user_id: item.user_id,
        role: item.roles?.name || "unknown",
        full_name: item.profiles?.full_name || "Unknown User",
      }));

      setAdmins(formattedAdmins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast({
        title: "Error",
        description: "Failed to load admin team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleRemoveRole = async (userId: string) => {
    try {
      // In a real app, you'd want to prevent removing the last admin
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setAdmins(prev => prev.filter(a => a.user_id !== userId));
      toast({
        title: "Success",
        description: "User role removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user role",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Submission Pricing */}
      <Card className="bg-card border-white/10">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-dem" />
            <CardTitle className="text-xl text-white">Submission Pricing</CardTitle>
          </div>
          <CardDescription className="text-white/40">Configure how much you charge for playlist submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="standard" className="text-white/40">Standard Review ($)</Label>
              <Input id="standard" defaultValue="20.00" className="bg-white/5 border-white/10 text-white focus:border-dem" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white/40">Priority Review ($)</Label>
              <Input id="priority" defaultValue="45.00" className="bg-white/5 border-white/10 text-white focus:border-dem" />
            </div>
          </div>
          <Button className="bg-dem hover:bg-dem/90 text-white gap-2">
            <Save className="w-4 h-4" />
            Save Pricing
          </Button>
        </CardContent>
      </Card>

      {/* Admin Management */}
      <Card className="bg-card border-white/10">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-dem" />
            <CardTitle className="text-xl text-white">Team & Permissions</CardTitle>
          </div>
          <CardDescription className="text-white/40">Manage who has access to this dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-dem" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-center text-white/40 py-8">No team members found.</p>
            ) : (
              admins.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold uppercase text-white">
                      {user.full_name?.substring(0, 2) || "??"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.full_name || "Unknown User"}</p>
                      <p className="text-xs text-white/40">{user.user_id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-dem/10 text-dem border border-dem/20">
                      {user.role}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveRole(user.user_id)}
                      className="text-rep hover:text-rep/80 hover:bg-rep/10"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Team Member
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
