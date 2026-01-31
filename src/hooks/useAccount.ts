import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Account {
  id: string;
  name: string;
  type: 'individual' | 'artist' | 'brand' | 'label' | 'agency';
  owner_user_id: string;
  status: string;
  balance?: number;
}

export function useAccount() {
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["user-accounts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from("accounts")
        .select(`
          *,
          account_members!inner(user_id)
        `)
        .eq("account_members.user_id", user.id);

      if (error) throw error;
      return data as unknown as Account[];
    },
  });

  const activeAccount = accounts?.[0]; // Default to the first account for now

  return {
    accounts,
    activeAccount,
    isLoading: isLoadingAccounts,
  };
}
