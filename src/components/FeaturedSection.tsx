import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Play, Flame } from "lucide-react";
import { format } from "date-fns";

export function FeaturedSection() {
  const { data: featuredPosts, isLoading } = useQuery({
    queryKey: ["featured-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !featuredPosts?.length) return null;

  const mainFeatured = featuredPosts[0];
  const sideFeatured = featuredPosts.slice(1, 4);

  const getThumbnail = (post: any) =>
    post.thumbnail_url || `https://img.youtube.com/vi/${post.youtube_id}/maxresdefault.jpg`;

  return (
    <section className="py-4 md:py-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Flame className="w-4 h-4 md:w-5 md:h-5 text-primary" />
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
                <span className="px-2 py-1 bg-primary text-primary-foreground text-[10px] md:text-xs font-body uppercase tracking-wider rounded">
                  Breaking
                </span>
              )}
              <span className="px-2 py-1 bg-accent text-accent-foreground text-[10px] md:text-xs font-body uppercase tracking-wider rounded">
                Featured
              </span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
              {mainFeatured.title}
            </h3>
            {mainFeatured.subtitle && (
              <p className="text-muted-foreground font-body text-xs md:text-sm line-clamp-2 hidden sm:block">
                {mainFeatured.subtitle}
              </p>
            )}
          </div>
          <div className="absolute top-3 md:top-4 right-3 md:right-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </Link>

        {/* Side Featured */}
        {sideFeatured.map((post) => (
          <Link
            key={post.id}
            to={`/post/${post.id}`}
            className="group relative aspect-video rounded-lg overflow-hidden"
          >
            <img
              src={getThumbnail(post)}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
              <p className="text-muted-foreground text-[10px] md:text-xs font-body uppercase tracking-wider mb-1">
                {format(new Date(post.created_at), "MMM d, yyyy")}
              </p>
              <h3 className="font-display text-base md:text-lg text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
