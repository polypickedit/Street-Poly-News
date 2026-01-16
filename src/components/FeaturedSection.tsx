import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "react-router-dom";
import { Play, Flame } from "lucide-react";
import { format } from "date-fns";
import { Post } from "@/hooks/usePosts";

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
        .limit(5);

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
  const sideFeatured = featuredPosts.slice(1, 4);

  const getThumbnail = (post: Post) =>
    post.thumbnail_url || `https://img.youtube.com/vi/${post.youtube_id}/maxresdefault.jpg`;

  return (
    <section className="py-4 md:py-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Flame className="w-4 h-4 md:w-5 md:h-5 text-rep" />
        <h2 className="font-display text-xl md:text-2xl text-foreground">Featured Stories</h2>
        <div className="flex-1 h-px bg-border ml-2" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Main Featured */}
        <Link
          to={`/post/${mainFeatured.id}`}
          className="sm:col-span-2 lg:col-span-2 lg:row-span-2 group relative aspect-video lg:aspect-auto min-h-[200px] lg:min-h-[400px] rounded-lg overflow-hidden"
        >
          <img
            src={getThumbnail(mainFeatured)}
            alt={mainFeatured.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              {mainFeatured.is_breaking && (
                <span className="px-2 py-1 bg-rep text-rep-foreground text-[10px] md:text-xs font-body uppercase tracking-wider rounded">
                  Breaking
                </span>
              )}
              <span className="px-2 py-1 bg-dem text-dem-foreground text-[10px] md:text-xs font-body uppercase tracking-wider rounded">
                Featured
              </span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight mb-2 group-hover:text-dem transition-colors">
              {mainFeatured.title}
            </h3>
            {mainFeatured.subtitle && (
              <p className="text-muted-foreground font-body text-xs md:text-sm line-clamp-2 hidden sm:block">
                {mainFeatured.subtitle}
              </p>
            )}
          </div>
          <div className="absolute top-3 md:top-4 right-3 md:right-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-dem/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 md:w-6 md:h-6 text-dem-foreground ml-0.5" fill="currentColor" />
          </div>
        </Link>

        {/* Small Featured Items */}
        <div className="flex flex-col gap-3 sm:gap-4 h-full">
          {sideFeatured.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="group flex-1 relative rounded-lg overflow-hidden min-h-[120px] lg:min-h-0"
            >
              <img
                src={getThumbnail(post)}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 bg-dem/80 text-dem-foreground text-[8px] md:text-[10px] font-body uppercase tracking-wider rounded">
                    Featured
                  </span>
                </div>
                <h4 className="font-display text-lg md:text-xl text-foreground leading-tight group-hover:text-dem transition-colors line-clamp-2">
                  {post.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
