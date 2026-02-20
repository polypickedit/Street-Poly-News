import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeQuery } from "@/lib/supabase-debug";
import { useAuth } from "@/hooks/useAuth";

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export function useCategories() {
  const { appReady } = useAuth();
  return useQuery({
    queryKey: ["categories"],
    queryFn: async ({ signal }) => {
      const data = await safeQuery(
        supabase
          .from("categories")
          .select("*")
          .order("name")
          .abortSignal(signal)
      ) as Category[] | null;

      return data || [];
    },
    enabled: appReady,
  });
}

export function usePostCategories(postId: number) {
  const { appReady } = useAuth();
  return useQuery({
    queryKey: ["post-categories", postId],
    queryFn: async ({ signal }) => {
      const data = await safeQuery(
        supabase
          .from("post_categories")
          .select(`
            category_id,
            categories (*)
          `)
          .eq("post_id", postId)
          .abortSignal(signal)
      ) as { categories: Category | null }[] | null;

      const postCategories = data || [];
      return postCategories
        .map((pc) => pc.categories)
        .filter((cat): cat is Category => cat !== null);
    },
    enabled: appReady && !!postId,
  });
}
