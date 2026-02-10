import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "./usePosts";
import { SupabaseClient } from "@supabase/supabase-js";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async ({ signal }) => {
      if (!query.trim()) return [];

      try {
        const supabaseQuery = (supabase as SupabaseClient)
          .from("posts")
          .select("*")
          .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,body_content.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(50) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: Post[] | null; error: { code: string; message: string } | null }> };

        const { data, error } = await supabaseQuery.abortSignal(signal);

        if (error) throw error;
        return data as Post[];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
    enabled: query.length > 2,
  });
}
