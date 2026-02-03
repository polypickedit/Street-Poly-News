import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ActiveAdmin {
  user_id: string;
  email: string;
  online_at: string;
}

// Temporary types for schema extensions not yet in generated definitions
type SupabaseRPCOverride = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

type SupabaseTableOverride = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>;
    };
  };
};

interface AdminContextType {
  isAdmin: boolean;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  toggleAdminMode: () => void;
  isWalkthroughActive: boolean;
  setIsWalkthroughActive: (active: boolean) => void;
  hasCompletedWalkthrough: boolean;
  completeWalkthrough: () => void;
  walkthroughStep: number;
  setWalkthroughStep: (step: number) => void;
  activeAdmins: ActiveAdmin[];
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(-1);
  const [activeAdmins, setActiveAdmins] = useState<ActiveAdmin[]>([]);

  // Check if current user is an admin
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Cast to unknown then to specific rpc type to avoid 'any' lint error
      const { data, error } = await (supabase as unknown as SupabaseRPCOverride)
        .rpc("is_admin_or_editor_safe", {
          target_user_id: user.id
        });
      
      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      return !!data;
    },
  });

  // Check if walkthrough is completed
  const { data: profile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      // Using casting to bypass missing property in generated types
      const { data } = await (supabase as unknown as SupabaseTableOverride)
        .from("profiles")
        .select("admin_walkthrough_completed_at")
        .eq("id", user.id)
        .single();
      return data as { admin_walkthrough_completed_at: string | null } | null;
    },
    enabled: !!isAdmin,
  });

  const completeWalkthroughMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    if (isAdmin) {
      setIsAdminMode((prev) => !prev);
    }
  }, [isAdmin]);

  const completeWalkthrough = () => {
    setIsWalkthroughActive(false);
    completeWalkthroughMutation.mutate();
  };

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
  }, [isAdmin, toggleAdminMode]);

  // Realtime Presence for Admins
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase.channel('online-admins');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const simplified = Object.values(state).flat() as unknown as ActiveAdmin[];
        setActiveAdmins(simplified);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              email: user.email,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [isAdmin]);

  return (
    <AdminContext.Provider 
      value={{ 
        isAdmin: !!isAdmin, 
        isAdminMode, 
        setIsAdminMode, 
        toggleAdminMode,
        isWalkthroughActive,
        setIsWalkthroughActive,
        hasCompletedWalkthrough: !!profile?.admin_walkthrough_completed_at,
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

