import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeQuery } from "@/lib/supabase-debug";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useRef } from "react";

export interface Account {
  id: string;
  name: string;
  type: 'individual' | 'artist' | 'brand' | 'label' | 'agency';
  owner_user_id: string;
  status: string;
  created_at: string;
}

type AccountFetchState =
  | "initializing"
  | "unauthenticated"
  | "loading"
  | "ready"
  | "error";

export function useAccount() {
  const { status: authStatus, user } = useAuth();
  const userId = user?.id ?? null;
  const enabled = authStatus === "authenticated" && !!userId;
  const previousStateRef = useRef<AccountFetchState | null>(null);

  const { data: activeAccount, isLoading, error, refetch } = useQuery({
    queryKey: ["active-account", userId],
    enabled,
    queryFn: async ({ signal }) => {
      try {
        if (!userId) {
          return null;
        }
        console.log("%cACCOUNT TRANSITION", "color: #60a5fa; font-weight: bold;", "fetch.start", { userId });

        // First try to find an account where the user is an owner
        const accounts = await safeQuery(
          (supabase
            .from("accounts")
            .select("*")
            .eq("owner_user_id", userId)
            .eq("status", "active")
            .limit(1) as unknown as { abortSignal: (s?: AbortSignal) => unknown }).abortSignal(signal)
        ) as Account[] | null;

        if (accounts?.length) {
          console.log("%cACCOUNT TRANSITION", "color: #60a5fa; font-weight: bold;", "fetch.owner_found", {
            userId,
            accountId: accounts[0].id,
          });
          return accounts[0] as Account;
        }

        // If no account found as owner, check account_members
        const memberships = await safeQuery(
          (supabase
            .from("account_members")
            .select("account_id, accounts(*)")
            .eq("user_id", userId)
            .limit(1) as unknown as { abortSignal: (s?: AbortSignal) => unknown }).abortSignal(signal)
        ) as Array<{ accounts: Account | null }> | null;

        if (memberships?.length && memberships[0].accounts) {
          const memberAccount = memberships[0].accounts as Account;
          if (memberAccount.status === "active") {
            console.log("%cACCOUNT TRANSITION", "color: #60a5fa; font-weight: bold;", "fetch.member_found", {
              userId,
              accountId: memberAccount.id,
            });
            return memberAccount;
          }
        }

        console.log("%cACCOUNT TRANSITION", "color: #60a5fa; font-weight: bold;", "fetch.none", { userId });
        return null;
      } catch (err) {
        if (err instanceof Error && (err.name === "AbortError" || err.message?.includes("abort"))) {
          return null;
        }
        throw err;
      }
    },
    refetchOnWindowFocus: false,
  });

  const state: AccountFetchState = useMemo(() => {
    if (authStatus === "initializing") return "initializing";
    if (authStatus !== "authenticated" || !userId) return "unauthenticated";
    if (isLoading) return "loading";
    if (error) return "error";
    return "ready";
  }, [authStatus, error, isLoading, userId]);

  useEffect(() => {
    if (previousStateRef.current === state) return;
    previousStateRef.current = state;
    console.log("%cACCOUNT TRANSITION", "color: #60a5fa; font-weight: bold;", state, {
      userId,
      hasAccount: !!activeAccount,
    });
  }, [activeAccount, state, userId]);

  return {
    activeAccount: activeAccount ?? null,
    isLoading: state === "loading" || state === "initializing",
    error,
    state,
    refetch,
  };
}
