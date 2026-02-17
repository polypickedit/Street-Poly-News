import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDurationDaysHours,
  getUsernameCooldownRemainingMs,
  validateUsername,
} from "@/lib/username";

const ProfileSettings = () => {
  const { toast } = useToast();
  const { profile, isLoading, refetch } = useProfile();

  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [availabilityPending, setAvailabilityPending] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile?.username]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const cooldownRemaining = useMemo(
    () => getUsernameCooldownRemainingMs(profile?.username_last_changed_at ?? null, now),
    [now, profile?.username_last_changed_at]
  );

  const canChangeUsername = cooldownRemaining <= 0;

  const canSubmit = useMemo(() => {
    const validation = validateUsername(username);
    if (!validation.valid) return false;
    if (!profile?.username) return true;
    if (username.trim() === profile.username.trim()) return false;
    return canChangeUsername;
  }, [canChangeUsername, profile?.username, username]);

  useEffect(() => {
    let cancelled = false;

    async function checkAvailability() {
      const validation = validateUsername(username);
      if (!validation.valid) {
        setAvailabilityMessage(validation.message ?? null);
        return;
      }

      if (!profile?.id) return;

      if (profile.username && username.trim().toLowerCase() === profile.username.trim().toLowerCase()) {
        setAvailabilityMessage("Current username");
        return;
      }

      setAvailabilityPending(true);
      const { data, error } = await supabase.rpc("check_username_availability", {
        p_username: username,
        p_current_user_id: profile.id,
      });

      if (cancelled) return;

      if (error) {
        setAvailabilityMessage("Could not verify username right now.");
      } else if (data?.[0]?.available) {
        setAvailabilityMessage("Username available");
      } else {
        setAvailabilityMessage("Username already taken. Try another.");
      }
      setAvailabilityPending(false);
    }

    const handle = window.setTimeout(() => {
      if (username.trim()) {
        void checkAvailability();
      } else {
        setAvailabilityMessage(null);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
      setAvailabilityPending(false);
    };
  }, [profile?.id, profile?.username, username]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || saving) return;

    try {
      setSaving(true);
      const { error } = await supabase.rpc("update_username", {
        p_new_username: username.trim(),
      });

      if (error) throw error;

      await refetch();
      toast({
        title: "Username updated",
        description: "Your public username has been updated.",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Unable to update username",
        description: err.message ?? "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-display text-2xl">Profile Settings</CardTitle>
            <CardDescription className="text-white/60">
              Usernames are public and unique. You can change your username once every 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/70">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <div className="text-xs text-white/60 min-h-[1rem]">
                  {availabilityPending ? "Checking username availability..." : availabilityMessage}
                </div>
              </div>

              {!canChangeUsername ? (
                <p className="text-sm text-yellow-300">
                  Username edits allowed once every 30 days. Try again in {formatDurationDaysHours(cooldownRemaining)}.
                </p>
              ) : null}

              <div className="pt-2">
                <Button type="submit" className="bg-dem hover:bg-dem/90" disabled={!canSubmit || saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Username
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;
