import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { Headphones, Plus, Loader2, Calendar, Users, DollarSign, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  listAdminListeningSessions,
  type AdminListeningSessionInput,
  type AdminListeningSessionRow,
  type AdminListeningTierInput,
  upsertListeningSessionWithTiers,
} from "@/lib/listeningSessions";

type SessionStatus = "draft" | "open" | "closed" | "completed";

type EditorTier = AdminListeningTierInput & {
  tempId: string;
  slots_filled?: number;
};

const blankSession = (): AdminListeningSessionInput => ({
  title: "",
  description: "",
  scheduled_at: format(addDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm"),
  status: "draft",
});

const defaultTiers = (): EditorTier[] => [
  { tempId: crypto.randomUUID(), tier_name: "Standard Review", price_cents: 3900, slot_limit: 20, description: "Written feedback + playlist consideration", manually_closed: false },
  { tempId: crypto.randomUUID(), tier_name: "Priority Review", price_cents: 7900, slot_limit: 10, description: "Early play + verbal and written feedback", manually_closed: false },
  { tempId: crypto.randomUUID(), tier_name: "Featured Spotlight", price_cents: 14900, slot_limit: 5, description: "Full listen + social spotlight", manually_closed: false },
];

const statusBadge = (status: SessionStatus) => {
  if (status === "open") return "bg-dem/10 text-dem border-dem/30";
  if (status === "closed") return "bg-rep/10 text-rep border-rep/30";
  if (status === "completed") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const toDatetimeLocal = (iso: string) => {
  const date = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export const ListeningSessionManager = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<AdminListeningSessionInput>(blankSession());
  const [tierForm, setTierForm] = useState<EditorTier[]>(defaultTiers());

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["listening-sessions-admin"],
    queryFn: listAdminListeningSessions,
  });

  const editingSession = useMemo(
    () => sessions.find((s) => s.id === editingSessionId) || null,
    [sessions, editingSessionId]
  );

  const openCreate = () => {
    setEditingSessionId(null);
    setSessionForm(blankSession());
    setTierForm(defaultTiers());
    setOpen(true);
  };

  const openEdit = (session: AdminListeningSessionRow) => {
    setEditingSessionId(session.id);
    setSessionForm({
      id: session.id,
      title: session.title,
      description: session.description || "",
      scheduled_at: toDatetimeLocal(session.scheduled_at),
      status: session.status,
    });
    setTierForm(
      session.tiers.map((tier) => ({
        tempId: tier.id,
        id: tier.id,
        tier_name: tier.tier_name,
        price_cents: tier.price_cents,
        slot_limit: tier.slot_limit,
        description: tier.description || "",
        manually_closed: tier.manually_closed,
        slots_filled: tier.slots_filled,
      }))
    );
    setOpen(true);
  };

  const updateTier = (tempId: string, patch: Partial<EditorTier>) => {
    setTierForm((prev) => prev.map((tier) => (tier.tempId === tempId ? { ...tier, ...patch } : tier)));
  };

  const removeTier = (tempId: string) => {
    setTierForm((prev) => prev.filter((tier) => tier.tempId !== tempId));
  };

  const addTier = () => {
    setTierForm((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        tier_name: "",
        price_cents: 0,
        slot_limit: 1,
        description: "",
        manually_closed: false,
      },
    ]);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Sign in required");
      return;
    }

    if (!sessionForm.title.trim()) {
      toast.error("Session title is required");
      return;
    }

    if (!sessionForm.scheduled_at) {
      toast.error("Scheduled time is required");
      return;
    }

    if (tierForm.length === 0) {
      toast.error("At least one tier is required");
      return;
    }

    if (tierForm.some((tier) => !tier.tier_name.trim())) {
      toast.error("Each tier must have a name");
      return;
    }

    setSaving(true);
    try {
      await upsertListeningSessionWithTiers(
        {
          ...sessionForm,
          scheduled_at: new Date(sessionForm.scheduled_at).toISOString(),
        },
        tierForm.map((tier) => ({
          id: tier.id,
          tier_name: tier.tier_name,
          price_cents: Number(tier.price_cents || 0),
          slot_limit: Number(tier.slot_limit || 1),
          description: tier.description || null,
          manually_closed: Boolean(tier.manually_closed),
        })),
        user.id
      );

      toast.success(editingSession ? "Session updated" : "Session created");
      queryClient.invalidateQueries({ queryKey: ["listening-sessions-admin"] });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Listening Sessions</h3>
        <Button className="bg-dem hover:bg-dem/90 text-white gap-2 font-black uppercase" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-dem" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-lg">
          <Headphones className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-black uppercase tracking-tighter">No sessions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const totalSlots = session.tiers.reduce((acc, t) => acc + Number(t.slot_limit || 0), 0);
            const filledSlots = session.tiers.reduce((acc, t) => acc + Number(t.slots_filled || 0), 0);

            return (
              <Card key={session.id} className="bg-card border-border hover:border-muted-foreground/30 transition-all overflow-hidden group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Badge className={`border ${statusBadge(session.status)}`}>{session.status.toUpperCase()}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(session)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="mt-3 text-lg font-black text-dem uppercase truncate">{session.title}</CardTitle>
                  <p className="text-xs text-muted-foreground line-clamp-2">{session.description || "No description"}</p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(session.scheduled_at), "MMM d, yyyy h:mm a")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {filledSlots} / {totalSlots} filled
                  </div>

                  <div className="space-y-2 border-t border-border pt-3">
                    {session.tiers.map((tier) => {
                      const remaining = Math.max(0, Number(tier.slot_limit || 0) - Number(tier.slots_filled || 0));
                      return (
                        <div key={tier.id} className="rounded-lg border border-border p-2.5 bg-muted/30">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase">{tier.tier_name}</span>
                            <span className="text-xs font-black text-dem">${(Number(tier.price_cents || 0) / 100).toFixed(2)}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {remaining} remaining of {tier.slot_limit}
                            {tier.manually_closed ? " • CLOSED" : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[900px] w-[96vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSession ? "Edit Listening Session" : "Create Listening Session"}</DialogTitle>
            <DialogDescription>Set schedule, status, and tier slot limits/pricing.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input
                value={sessionForm.title}
                onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Weekly Listening Session"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={sessionForm.status}
                onValueChange={(value: SessionStatus) => setSessionForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={sessionForm.description || ""}
                onChange={(e) => setSessionForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What artists can expect from this listening session"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Scheduled At</Label>
              <Input
                type="datetime-local"
                value={sessionForm.scheduled_at}
                onChange={(e) => setSessionForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider">Tier Configuration</h4>
              <Button variant="outline" size="sm" onClick={addTier}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Tier
              </Button>
            </div>

            {tierForm.map((tier) => {
              const minLimit = Number(tier.slots_filled || 0);
              return (
                <div key={tier.tempId} className="rounded-xl border border-border p-3 bg-muted/20 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-xs">Tier Name</Label>
                      <Input
                        value={tier.tier_name}
                        onChange={(e) => updateTier(tier.tempId, { tier_name: e.target.value })}
                        placeholder="Standard Review"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={(Number(tier.price_cents || 0) / 100).toFixed(2)}
                        onChange={(e) => {
                          const dollars = Number(e.target.value || 0);
                          updateTier(tier.tempId, { price_cents: Math.max(0, Math.round(dollars * 100)) });
                        }}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Slot Limit</Label>
                      <Input
                        type="number"
                        min={Math.max(1, minLimit)}
                        value={tier.slot_limit}
                        onChange={(e) => {
                          const next = Number(e.target.value || 1);
                          updateTier(tier.tempId, { slot_limit: Math.max(Math.max(1, minLimit), next) });
                        }}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Closed</Label>
                      <Select
                        value={tier.manually_closed ? "yes" : "no"}
                        onValueChange={(value) => updateTier(tier.tempId, { manually_closed: value === "yes" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => removeTier(tier.tempId)}
                        disabled={tierForm.length <= 1}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={tier.description || ""}
                      onChange={(e) => updateTier(tier.tempId, { description: e.target.value })}
                      placeholder="What this tier includes"
                    />
                    <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      Filled slots: {tier.slots_filled || 0}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingSession ? "Save Changes" : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
