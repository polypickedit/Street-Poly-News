import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfile {
  id: string;
  username: string | null;
  username_normalized: string | null;
  display_name: string | null;
  profile_type: "artist" | "viewer" | null;
  username_last_changed_at: string | null;
  username_change_count: number | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export function useProfile() {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: status === "authenticated" && !!userId,
    queryFn: async ({ signal }) => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, username_normalized, display_name, profile_type, username_last_changed_at, username_change_count, full_name, avatar_url, created_at, updated_at"
        )
        .eq("id", userId)
        .abortSignal(signal)
        .maybeSingle();

      if (error) throw error;
      return (data as UserProfile | null) ?? null;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const requiresArtistCompletion = useMemo(() => {
    const profile = query.data;
    if (!profile) return false;
    return profile.profile_type === "artist" && !profile.display_name;
  }, [query.data]);

  return {
    ...query,
    profile: query.data ?? null,
    requiresArtistCompletion,
  };
}
