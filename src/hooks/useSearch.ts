import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "./usePosts";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,body_content.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Post[];
    },
    enabled: query.length > 2,
  });
}
