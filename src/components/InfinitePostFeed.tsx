import { useEffect, useRef, Fragment } from "react";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "./PostCard";
import { AdBanner } from "./AdBanner";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";

export function InfinitePostFeed() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get("category");

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
      <div className="text-center py-20">
        <p className="text-destructive font-body">Failed to load posts</p>
      </div>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];
  // Deduplicate posts by ID to prevent key warnings
  const posts = Array.from(new Map(allPosts.map(post => [post.id, post])).values());

  return (
    <div id="videos">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {posts.map((post, index) => {
          const delayClass = `delay-${Math.min(index, 10)}`;
          const showAd = (index + 1) % 7 === 0;
          
          return (
            <Fragment key={post.id}>
              <div 
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
              {showAd && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 my-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-body text-muted-foreground uppercase tracking-[0.2em]">Advertisement</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <AdBanner showLabel={false} />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      <div ref={loadMoreRef} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <Loader2 className="w-6 h-6 text-dem animate-spin" />
        )}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-muted-foreground font-body text-sm">
            You've reached the end
          </p>
        )}
      </div>
    </div>
  );
}