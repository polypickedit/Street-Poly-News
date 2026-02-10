import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

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

  try {
    const client = supabase as SupabaseClient;
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

    const query = baseQuery
      .order("created_at", { ascending: false })
      .range(from, to) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: Post[] | null; error: unknown }> };

    const { data, error } = await query.abortSignal(signal);

    if (error) throw error;
    
    return {
      posts: data as Post[],
      nextPage: data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
    };
  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
      return { posts: [], nextPage: undefined };
    }
    throw err;
  }
}

export function usePosts(category?: string | null) {
  return useInfiniteQuery({
    queryKey: ["posts", category],
    queryFn: ({ pageParam, signal }) => fetchPosts({ pageParam, category, signal }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export function usePost(id: string) {
  return useInfiniteQuery({
    queryKey: ["post", id],
    queryFn: async ({ signal }) => {
      try {
        const query = (supabase as SupabaseClient)
          .from("posts")
          .select("*")
          .eq("id", parseInt(id))
          .single() as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: Post | null; error: unknown }> };

        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;
        return { posts: [data as Post], nextPage: undefined };
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return { posts: [], nextPage: undefined };
        }
        throw err;
      }
    },
    getNextPageParam: () => undefined,
    initialPageParam: 0,
  });
}
