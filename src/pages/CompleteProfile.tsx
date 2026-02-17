import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { validateUsername } from "@/lib/username";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status, user } = useAuth();
  const { profile, isLoading, refetch } = useProfile();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setDisplayName(profile.display_name ?? profile.full_name ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (status === "initializing" || isLoading) return;
    if (!user || status !== "authenticated") {
      navigate("/login", { replace: true });
      return;
    }
    if (profile && (profile.profile_type !== "artist" || !!profile.display_name)) {
      navigate("/", { replace: true });
    }
  }, [isLoading, navigate, profile?.display_name, profile?.profile_type, status, user]);

  const canSubmit = useMemo(() => {
    const usernameResult = validateUsername(username);
    return usernameResult.valid && displayName.trim().length > 0;
  }, [username, displayName]);

  if (status === "initializing" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
      </div>
    );
  }

  if (
    !user ||
    status !== "authenticated" ||
    (profile !== null && profile?.profile_type !== "artist") ||
    !!profile?.display_name
  ) {
    return null;
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      setUsernameError(usernameValidation.message ?? "Invalid username");
      return;
    }

    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Artist profiles require a display name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setUsernameError(null);

      const { data: availability, error: availabilityError } = await supabase.rpc(
        "check_username_availability",
        {
          p_username: username,
          p_current_user_id: user.id,
        }
      );

      if (availabilityError) throw availabilityError;

      const firstResult = availability?.[0];
      if (!firstResult?.available) {
        setUsernameError("Username already taken. Try another.");
        return;
      }

      const { error } = await supabase.rpc("complete_profile_setup", {
        p_username: username,
        p_profile_type: "artist",
        p_display_name: displayName.trim(),
      });

      if (error) throw error;

      await refetch();

      toast({
        title: "Profile completed",
        description: "You can now continue browsing and submitting.",
      });

      navigate("/", { replace: true });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Unable to save profile",
        description: err.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-lg bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl text-white font-display">Complete your artist profile</CardTitle>
          <CardDescription className="text-white/60">
            Add your artist display name to continue. Your username is public and unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/70">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                required
              />
              {usernameError ? <p className="text-xs text-red-400">{usernameError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-white/70">Artist Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>

            <Button className="w-full bg-dem hover:bg-dem/90" type="submit" disabled={!canSubmit || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
