import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(-1);

  // Check if current user is an admin
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase.rpc("is_admin_or_editor_safe", {
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
      const { data } = await supabase
        .from("profiles")
        .select("admin_walkthrough_completed_at")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!isAdmin,
  });

  const completeWalkthroughMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ admin_walkthrough_completed_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    },
  });

  const toggleAdminMode = () => {
    if (isAdmin) {
      setIsAdminMode((prev) => !prev);
    }
  };

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
        setWalkthroughStep
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
