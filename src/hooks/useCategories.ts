import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function usePostCategories(postId: number) {
  return useQuery({
    queryKey: ["post-categories", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_categories")
        .select(`
          category_id,
          categories (*)
        `)
        .eq("post_id", postId);

      if (error) throw error;
      const postCategories = data as unknown as { categories: Category }[];
      return postCategories.map((pc) => pc.categories).filter((cat): cat is Category => cat !== null);
    },
    enabled: !!postId,
  });
}
