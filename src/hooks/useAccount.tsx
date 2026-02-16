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
        console.log("useAccount: Fetching account...");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("useAccount: No user found.");
          return null;
        }

        console.log("useAccount: User found:", user.id);

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
            console.error("Error fetching account by owner:", error);
          }
          // If error, don't return null yet, try member lookup
        }

        if (accounts && accounts.length > 0) {
          console.log("useAccount: Account found (owner):", accounts[0]);
          return accounts[0] as Account;
        }

        // If no account found as owner, check account_members
        console.log("useAccount: No owned account, checking memberships...");
        
        const { data: memberships, error: memberError } = await supabase
          .from("account_members")
          .select("account_id, accounts(*)")
          .eq("user_id", user.id)
          .limit(1);

        if (memberError) {
          console.error("Error fetching account memberships:", memberError);
          return null;
        }

        if (memberships && memberships.length > 0 && memberships[0].accounts) {
           const memberAccount = memberships[0].accounts as unknown as Account;
           // Ensure it's active
           if (memberAccount.status === 'active') {
             console.log("useAccount: Account found (member):", memberAccount);
             return memberAccount;
           }
        }

        console.log("useAccount: No active account found for user.");
        return null;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return null;
        }
        console.error("useAccount error:", err);
        return null;
      }
    },
    // Force refetch on mount to ensure fresh data
    refetchOnMount: true,
  });

  return {
    activeAccount,
    isLoading,
    error,
  };
}
