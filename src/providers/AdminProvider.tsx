import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActiveAdmin } from "@/types/admin";
import { AdminContext } from "@/contexts/AdminContext";
import { useAuth } from "@/hooks/useAuth";
import { isAbortError } from "@/lib/supabase-debug";

type SupabaseTableOverride = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        single: () => { abortSignal: (s?: AbortSignal) => Promise<{ data: unknown; error: unknown }> };
      };
    };
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>;
    };
  };
};

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, status, isAdmin, isEditor } = useAuth();
  const hasAdminAccess = status === "authenticated" && (isAdmin || isEditor);
  const queryClient = useQueryClient();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(-1);
  const [activeAdmins, setActiveAdmins] = useState<ActiveAdmin[]>([]);
  const [hasDismissedWalkthrough, setHasDismissedWalkthrough] = useState(false);

  // Check if walkthrough is completed
  const { data: profile } = useQuery({
    queryKey: ["admin-profile", user?.id ?? null],
    queryFn: async ({ signal }) => {
      try {
        if (!user) return null;
        // Using casting to bypass missing property in generated types
        const { data } = await (supabase as unknown as SupabaseTableOverride)
          .from("profiles")
          .select("admin_walkthrough_completed_at")
          .eq("id", user.id)
          .single()
          .abortSignal(signal);
        return data as { admin_walkthrough_completed_at: string | null } | null;
      } catch (err) {
        if (isAbortError(err)) {
          return null;
        }
        throw err;
      }
    },
    enabled: hasAdminAccess && !!user,
  });

  const hasCompletedWalkthrough = !!profile?.admin_walkthrough_completed_at;

  useEffect(() => {
    if (hasCompletedWalkthrough) {
      setHasDismissedWalkthrough(true);
    }
  }, [hasCompletedWalkthrough]);

  const completeWalkthroughMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await (supabase as unknown as SupabaseTableOverride)
        .from("profiles")
        .update({ admin_walkthrough_completed_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    },
  });

  const toggleAdminMode = useCallback(() => {
    if (hasAdminAccess) {
      setIsAdminMode((prev) => {
        const next = !prev;
        if (!next) {
          setIsWalkthroughActive(false);
        }
        return next;
      });
    }
  }, [hasAdminAccess]);

  const completeWalkthrough = () => {
    setIsWalkthroughActive(false);
    setHasDismissedWalkthrough(true);
    completeWalkthroughMutation.mutate();
  };

  // Safety: never keep admin mode active after access is lost.
  useEffect(() => {
    if (hasAdminAccess) return;
    setIsAdminMode(false);
    setIsWalkthroughActive(false);
    setWalkthroughStep(-1);
    setActiveAdmins([]);
  }, [hasAdminAccess]);

  // Keyboard shortcut: Ctrl + Alt + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === "a") {
        e.preventDefault();
        toggleAdminMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasAdminAccess, toggleAdminMode]);

  // Realtime Presence for Admins
  useEffect(() => {
    if (!hasAdminAccess || !user) return;

    const channel = supabase.channel('online-admins');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const simplified = Object.values(state).flat() as unknown as ActiveAdmin[];
        setActiveAdmins(simplified);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            email: user.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [hasAdminAccess, user]);

  return (
    <AdminContext.Provider 
      value={{ 
        isAdmin: hasAdminAccess, 
        isAdminMode, 
        setIsAdminMode, 
        toggleAdminMode,
        isWalkthroughActive,
        setIsWalkthroughActive,
        hasCompletedWalkthrough,
        hasDismissedWalkthrough,
        completeWalkthrough,
        walkthroughStep,
        setWalkthroughStep,
        activeAdmins
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
