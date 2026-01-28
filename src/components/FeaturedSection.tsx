import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "react-router-dom";
import { Play, Flame } from "lucide-react";
import { format } from "date-fns";
import { Post } from "@/hooks/usePosts";
import { PostCard } from "./PostCard";

export function FeaturedSection() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get("category");

  const { data: featuredPosts, isLoading } = useQuery({
    queryKey: ["featured-posts", currentCategory],
    queryFn: async () => {
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
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(7);

      if (currentCategory) {
        query = query.eq("post_categories.categories.slug", currentCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Post[];
    },
  });

  if (isLoading || !featuredPosts?.length) return null;

  const mainFeatured = featuredPosts[0];
  const sideFeatured = featuredPosts.slice(1, 7); // Get 6 side videos for 2x3 grid

  const getThumbnail = (post: Post) =>
    post.thumbnail_url || `https://img.youtube.com/vi/${post.youtube_id}/hqdefault.jpg`;

  return (
    <section className="py-4 md:py-6">
      <div className="px-4">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 px-4">
          <Flame className="w-4 h-4 md:w-5 md:h-5 text-rep" />
          <h2 className="font-display text-xl md:text-2xl text-foreground">Featured Stories</h2>
          <div className="flex-1 h-px bg-border ml-2" />
        </div>
        
        <div className="space-y-4 md:space-y-6">
          <Link
            to={`/post/${mainFeatured.id}`}
            className="group relative block aspect-video w-full overflow-hidden rounded-2xl lg:aspect-[21/9]"
          >
            <img
              src={getThumbnail(mainFeatured)}
              alt={mainFeatured.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 md:p-6">
              <div className="flex items-center gap-3">
                {mainFeatured.is_featured && (
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400 backdrop-blur-sm">
                    Featured
                  </span>
                )}
                <span className="text-xs uppercase tracking-widest text-white/60">
                  {mainFeatured.content_type}
                </span>
              </div>
              <h2 className="mt-2 font-display text-xl text-white sm:text-2xl md:text-4xl">
                {mainFeatured.title}
              </h2>
            </div>
          </Link>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {sideFeatured.map((post) => (
              <PostCard
                key={post.id}
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
