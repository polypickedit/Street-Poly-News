import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Account {
  id: string;
  name: string;
  type: 'individual' | 'artist' | 'brand' | 'label' | 'agency';
  owner_user_id: string;
  status: string;
  created_at: string;
}

export function useAccount() {
  const { data: activeAccount, isLoading, error } = useQuery({
    queryKey: ["active-account"],
    queryFn: async ({ signal }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // First try to find an account where the user is an owner
        const query = supabase
          .from("accounts")
          .select("*")
          .eq("owner_user_id", user.id)
          .eq("status", "active")
          .limit(1) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: Account[] | null; error: { code: string; message: string } | null }> };

        const result = await query.abortSignal(signal);
        const accounts = result.data;
        const error = result.error;

        if (error) {
          // Only log if it's not an RLS recursion error which we are fixing via migration
          if (error.code !== '42P17') {
            console.error("Error fetching account:", error);
          }
          return null;
        }

        if (accounts && accounts.length > 0) {
          return accounts[0] as Account;
        }

        return null;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return null;
        }
        console.error("useAccount error:", err);
        return null;
      }
    },
  });

  return {
    activeAccount,
    isLoading,
    error,
  };
}
