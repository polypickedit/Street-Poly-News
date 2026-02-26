import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeQuery } from "@/lib/supabase-debug";
import { useAuth } from "@/hooks/useAuth";
import { getYouTubeId } from "@/lib/utils";

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

type YouTubeMetadata = {
  videoId: string;
  description: string;
  thumbnail: string | null;
  viewCount: number | null;
};

type YouTubeFeedResponse = {
  byId?: Record<string, YouTubeMetadata>;
};

async function hydratePostsWithYouTubeMetadata(posts: Post[]): Promise<Post[]> {
  if (!posts.length) return posts;

  const videoIds = Array.from(
    new Set(
      posts
        .map((post) => getYouTubeId(post.youtube_id))
        .filter((id): id is string => !!id)
    )
  );

  if (!videoIds.length) return posts;

  const { data, error } = await supabase.functions.invoke("youtube-feed", {
    body: { videoIds },
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("youtube-feed invoke failed, continuing with DB values", error);
    }
    return posts;
  }

  const byId = ((data as YouTubeFeedResponse | null)?.byId ?? {}) as Record<string, YouTubeMetadata>;

  return posts.map((post) => {
    const videoId = getYouTubeId(post.youtube_id);
    if (!videoId) return post;

    const metadata = byId[videoId];
    if (!metadata) return post;

    return {
      ...post,
      subtitle: post.subtitle || metadata.description || null,
      thumbnail_url: post.thumbnail_url || metadata.thumbnail,
      view_count: post.view_count ?? metadata.viewCount ?? null,
    };
  });
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
  const hydrated = await hydratePostsWithYouTubeMetadata(data);
  
  return {
    posts: hydrated,
    nextPage: hydrated.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
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
