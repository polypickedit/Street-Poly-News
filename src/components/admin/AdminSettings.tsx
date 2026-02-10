import { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShieldCheck, 
  Save,
  Loader2,
  UserPlus,
  Globe,
  Music,
  CreditCard,
  RefreshCw,
  Share2
} from "lucide-react";

interface AdminUser {
  user_id: string;
  role: string;
  full_name: string | null;
  email?: string;
}

interface SlotPrice {
  id: string;
  name: string;
  slug: string;
  price: number;
}

interface OutletPrice {
  id: string;
  name: string;
  price_cents: number;
  outlet_type: string;
}

export const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [editingOutletPrices, setEditingOutletPrices] = useState<Record<string, number>>({});
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");

  // Fetch Roles
  const { data: availableRoles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async ({ signal }) => {
      try {
        const query = (supabase as SupabaseClient).from("roles").select("id, name") as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: { id: string, name: string }[] | null, error: { message: string } | null }> };
        const { data, error } = await query.abortSignal(signal);
        if (error) throw error;
        return data || [];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    }
  });

  // Fetch Team
  const { data: admins = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ["admin-team"],
    queryFn: async ({ signal }) => {
      try {
        const query = (supabase as SupabaseClient)
          .from("user_roles")
          .select(`
            user_id,
            roles (name),
            profiles (full_name)
          `) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: { user_id: string, roles: { name: string } | null, profiles: { full_name: string | null } | null }[] | null, error: { message: string } | null }> };
        
        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;

        return (data || []).map(item => {
          const roles = item.roles as { name: string } | null;
          const profiles = item.profiles as { full_name: string | null } | null;
          return {
            user_id: item.user_id,
            role: roles?.name || "unknown",
            full_name: profiles?.full_name || "Unknown User",
          };
        });
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    }
  });

  // Fetch Slot Pricing
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ["admin-slots-pricing"],
    queryFn: async ({ signal }) => {
      try {
        const { data, error } = await supabase
          .from("slots")
          .select("id, name, slug, price")
          .eq("is_active", true)
          .abortSignal(signal);

        if (error) throw error;
        return data as SlotPrice[];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    }
  });

  // Fetch Outlet Pricing
  const { data: outlets = [], isLoading: loadingOutlets } = useQuery({
    queryKey: ["admin-outlets-pricing"],
    queryFn: async ({ signal }) => {
      try {
        const { data, error } = await supabase
          .from("media_outlets")
          .select("id, name, price_cents, outlet_type")
          .eq("active", true)
          .abortSignal(signal);

        if (error) throw error;
        return data as OutletPrice[];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    }
  });

  const updateSlotMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase
        .from("slots")
        .update({ price })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots-pricing"] });
      toast({ title: "Success", description: "Slot price updated" });
    }
  });

  const updateOutletMutation = useMutation({
    mutationFn: async ({ id, priceCents }: { id: string; priceCents: number }) => {
      const { error } = await supabase
        .from("media_outlets")
        .update({ price_cents: priceCents })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-outlets-pricing"] });
      toast({ title: "Success", description: "Outlet price updated" });
    }
  });

  const addAdminMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role_id: roleId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team"] });
      toast({ title: "Success", description: "Team member added" });
      setIsInviteDialogOpen(false);
      setInviteUserId("");
      setInviteRoleId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    }
  });

  const handleRemoveRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-team"] });
      toast({ title: "Success", description: "User role removed" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user role",
        variant: "destructive",
      });
    }
  };

  const loading = loadingAdmins || loadingSlots || loadingOutlets;

  return (
    <div className="max-w-4xl space-y-8 pb-12 text-foreground">
      {/* System Status Quick Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-3 h-3" /> Stripe Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-black text-dem uppercase">Live</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <RefreshCw className="w-3 h-3" /> Database Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-black text-dem uppercase">Healthy</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Globe className="w-3 h-3" /> Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-dem px-1.5 py-0.5 rounded bg-dem/10 border border-dem/20 uppercase tracking-tighter">Production</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Slot Pricing */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Music className="w-5 h-5 text-dem" />
            <CardTitle className="text-xl font-black text-dem uppercase">Campaign & Slot Pricing</CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">Configure pricing for different submission slots and campaign types.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingSlots ? (
              <Loader2 className="w-6 h-6 animate-spin text-dem" />
            ) : (
              slots.map(slot => (
                <div key={slot.id} className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                  <div className="flex justify-between items-start">
                    <Label className="text-muted-foreground text-sm uppercase font-bold tracking-wider">{slot.name}</Label>
                    <span className="text-xs text-muted-foreground font-mono">{slot.slug}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input 
                        type="number"
                        value={editingPrices[slot.id] ?? slot.price}
                        onChange={(e) => setEditingPrices(prev => ({ ...prev, [slot.id]: parseFloat(e.target.value) }))}
                        className="bg-background border-input pl-7 focus:border-dem" 
                      />
                    </div>
                    <Button 
                      type="button"
                      size="sm"
                      className="bg-dem/20 hover:bg-dem/30 text-dem border border-dem/30"
                      onClick={() => updateSlotMutation.mutate({ id: slot.id, price: editingPrices[slot.id] ?? slot.price })}
                      disabled={updateSlotMutation.isPending || editingPrices[slot.id] === undefined || editingPrices[slot.id] === slot.price}
                    >
                      {updateSlotMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Outlet Syndication Pricing */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="w-5 h-5 text-dem" />
            <CardTitle className="text-xl font-black text-dem uppercase">Syndication Network Fees</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">Manage fees for distributing content to external media outlets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingOutlets ? (
              <Loader2 className="w-6 h-6 animate-spin text-dem" />
            ) : (
              outlets.map(outlet => (
                <div key={outlet.id} className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                  <div className="flex justify-between items-start">
                    <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{outlet.name}</Label>
                    <Badge variant="outline" className="text-[10px] uppercase bg-muted/50 text-muted-foreground border-border">{outlet.outlet_type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input 
                        type="number"
                        value={editingOutletPrices[outlet.id] ?? (outlet.price_cents / 100)}
                        onChange={(e) => setEditingOutletPrices(prev => ({ ...prev, [outlet.id]: parseFloat(e.target.value) }))}
                        className="bg-background border-input pl-7 focus:border-dem" 
                      />
                    </div>
                    <Button 
                      type="button"
                      size="sm"
                      className="bg-dem/20 hover:bg-dem/30 text-dem border border-dem/30"
                      onClick={() => updateOutletMutation.mutate({ id: outlet.id, priceCents: (editingOutletPrices[outlet.id] ?? (outlet.price_cents / 100)) * 100 })}
                      disabled={updateOutletMutation.isPending || editingOutletPrices[outlet.id] === undefined || (editingOutletPrices[outlet.id] * 100) === outlet.price_cents}
                    >
                      {updateOutletMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Management */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-dem" />
            <CardTitle className="text-xl font-black text-dem uppercase">Team & Permissions</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">Manage who has access to this dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {loadingAdmins ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-dem" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No team members found.</p>
            ) : (
              admins.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase text-foreground">
                      {user.full_name?.substring(0, 2) || "??"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.full_name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{user.user_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded bg-dem/10 text-dem border border-dem/20">
                      {user.role}
                    </span>
                    <Button 
                      type="button"
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
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary" className="gap-2 bg-dem hover:bg-dem/90 text-white font-black uppercase">
                <UserPlus className="w-4 h-4" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Assign a role to a user by their Supabase User ID.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID (UUID)</Label>
                  <Input 
                    id="userId"
                    placeholder="00000000-0000-0000-0000-000000000000"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => setIsInviteDialogOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={() => addAdminMutation.mutate({ userId: inviteUserId, roleId: inviteRoleId })}
                  disabled={!inviteUserId || !inviteRoleId || addAdminMutation.isPending}
                  className="bg-dem hover:bg-dem/90 text-white font-black uppercase"
                >
                  {addAdminMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};
