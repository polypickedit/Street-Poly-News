import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "./usePosts";
import { safeQuery } from "@/lib/supabase-debug";
import { useAuth } from "@/hooks/useAuth";

export function useSearch(query: string) {
  const { appReady } = useAuth();
  return useQuery({
    queryKey: ["search", query],
    queryFn: async ({ signal }) => {
      if (!query.trim()) return [];

      const posts = await safeQuery(
        supabase
          .from("posts")
          .select("*")
          .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,body_content.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(50)
          .abortSignal(signal)
      ) as Post[] | null;

      return posts || [];
    },
    enabled: appReady && query.length > 2,
  });
}
