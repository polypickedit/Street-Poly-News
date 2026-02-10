import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async ({ signal }) => {
      try {
        const query = (supabase as SupabaseClient)
          .from("categories")
          .select("*")
          .order("name") as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: Category[] | null; error: { code: string; message: string } | null }> };

        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;
        return data as Category[];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
  });
}

export function usePostCategories(postId: number) {
  return useQuery({
    queryKey: ["post-categories", postId],
    queryFn: async ({ signal }) => {
      try {
        const query = (supabase as SupabaseClient)
          .from("post_categories")
          .select(`
            category_id,
            categories (*)
          `)
          .eq("post_id", postId) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: { categories: Category }[] | null; error: { code: string; message: string } | null }> };

        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;
        const postCategories = data || [];
        return postCategories.map((pc) => pc.categories).filter((cat): cat is Category => cat !== null);
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
    enabled: !!postId,
  });
}
