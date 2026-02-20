import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeQuery } from "@/lib/supabase-debug";
import { useAuth } from "@/hooks/useAuth";

const POSTS_PER_PAGE = 9;

export interface Post {
  id: number;
  title: string;
  subtitle: string | null;
  youtube_id: string;
  thumbnail_url: string | null;
  created_at: string;
  content_type: "video" | "article" | "gallery" | null;
  body_content: string | null;
  is_featured: boolean | null;
  is_breaking: boolean | null;
  view_count: number | null;
}

async function fetchPosts({ 
  pageParam = 0, 
  category,
  signal
}: { 
  pageParam?: number;
  category?: string | null;
  signal?: AbortSignal;
}) {
  const from = pageParam * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  const client = supabase;
  const baseQuery = category 
    ? client
      .from("posts")
      .select(`
        *,
        post_categories!inner (
          category_id,
          categories (
            slug
          )
        )
      `)
      .eq("post_categories.categories.slug", category)
    : client
      .from("posts")
      .select("*");

  const posts = await safeQuery(
    baseQuery
      .order("created_at", { ascending: false })
      .abortSignal(signal)
      .range(from, to)
  ) as Post[] | null;
  
  const data = posts || [];
  
  return {
    posts: data,
    nextPage: data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
  };
}

export function usePosts(category?: string | null) {
  const { appReady } = useAuth();
  return useInfiniteQuery({
    queryKey: ["posts", category || null],
    queryFn: ({ pageParam, signal }) => fetchPosts({ pageParam, category, signal }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: appReady,
  });
}

export function usePost(id: string) {
  const { appReady } = useAuth();
  return useInfiniteQuery({
    queryKey: ["post", id],
    queryFn: async ({ signal }) => {
      const post = await safeQuery(
        supabase
          .from("posts")
          .select("*")
          .eq("id", parseInt(id))
          .abortSignal(signal)
          .single()
      ) as Post | null;

      if (!post) return { posts: [], nextPage: undefined };
      return { posts: [post], nextPage: undefined };
    },
    getNextPageParam: () => undefined,
    initialPageParam: 0,
    enabled: appReady && !!id,
  });
}
