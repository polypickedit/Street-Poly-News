import { useEffect, useRef } from "react";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "./PostCard";
import { Loader2, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

interface InfinitePostFeedProps {
  category?: string | null;
  variant?: "list" | "grid";
}

export function InfinitePostFeed({ category: propCategory, variant = "list" }: InfinitePostFeedProps = {}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = propCategory || searchParams.get("category");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    usePosts(currentCategory);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-dem animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-muted/30 border border-border rounded-xl">
        <p className="text-foreground font-black uppercase tracking-widest text-sm">Failed to load posts</p>
        <p className="text-muted-foreground text-xs mt-2 italic">Please try refreshing the page</p>
      </div>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];
  // Deduplicate posts by ID to prevent key warnings
  const posts = Array.from(new Map(allPosts.map(post => [post.id, post])).values());

  if (posts.length === 0 && !isLoading && !isFetchingNextPage) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-dem/40" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-[0.2em] text-foreground mb-2">
          Coming Soon
        </h3>
        <p className="text-muted-foreground text-sm font-body max-w-xs mx-auto">
          We're currently curating the best street politics content for this category. Check back shortly!
        </p>
        <div className="mt-8 h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    );
  }

  return (
    <div id="videos">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {posts.map((post, index) => {
          const delayClass = `delay-${Math.min(index, 10)}`;
          
          return (
            <div 
              key={post.id}
              className={`animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both ${delayClass}`}
            >
              <PostCard
                id={post.id}
                title={post.title}
                subtitle={post.subtitle}
                youtube_id={post.youtube_id}
                thumbnail_url={post.thumbnail_url}
                created_at={post.created_at}
                content_type={post.content_type}
                is_breaking={post.is_breaking ?? false}
                is_featured={post.is_featured ?? false}
                view_count={post.view_count}
              />
            </div>
          );
        })}
      </div>

      <div ref={loadMoreRef} className="flex justify-center py-12">
        {isFetchingNextPage ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-dem animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 animate-pulse">Loading more</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-px w-12 bg-border" />
            <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">
              Coming Soon
            </p>
            <div className="h-px w-12 bg-border" />
          </div>
        )}
      </div>
    </div>
  );
}