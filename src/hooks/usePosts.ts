import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const POSTS_PER_PAGE = 10;

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
  category 
}: { 
  pageParam?: number;
  category?: string | null;
}) {
  const from = pageParam * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  let query = supabase
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
    .order("created_at", { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq("post_categories.categories.slug", category);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  return {
    posts: data as Post[],
    nextPage: data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
  };
}

export function usePosts(category?: string | null) {
  return useInfiniteQuery({
    queryKey: ["posts", category],
    queryFn: ({ pageParam }) => fetchPosts({ pageParam, category }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export function usePost(id: string) {
  return useInfiniteQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (error) throw error;
      return { posts: [data as Post], nextPage: undefined };
    },
    getNextPageParam: () => undefined,
    initialPageParam: 0,
  });
}
