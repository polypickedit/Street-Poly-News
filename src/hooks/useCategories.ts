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
      return data.map((pc: any) => pc.categories as Category);
    },
    enabled: !!postId,
  });
}
