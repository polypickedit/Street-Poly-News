import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "react-router-dom";
import { Play, Flame, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Post } from "@/hooks/usePosts";
import { PostCard } from "./PostCard";
import { getYouTubeId } from "@/lib/utils";
import { Slot } from "./Slot";

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

  const mainFeaturedFallback = featuredPosts[0];
  const sideFeatured = featuredPosts.slice(1, 7); // Get 6 side videos for 2x3 grid

  const getThumbnail = (post: Post) => {
    if (post.thumbnail_url) {
      return post.thumbnail_url;
    }
    const videoId = getYouTubeId(post.youtube_id);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80";
  };

  return (
    <section className="py-4 md:py-6">
      <div className="px-4">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 px-4">
          <Flame className="w-4 h-4 md:w-5 md:h-5 text-rep" />
          <h2 className="font-display text-xl md:text-2xl text-white">Featured Stories</h2>
          <div className="flex-1 h-px bg-white/10 ml-2" />
        </div>
        
        <div className="space-y-4 md:space-y-6">
          <Slot
            slotKey="home.hero"
            accepts={["video", "article"]}
            fallback={<HeroPost post={mainFeaturedFallback} getThumbnail={getThumbnail} />}
          >
            {(placement) => (
              <ResolvedHero id={placement?.id} getThumbnail={getThumbnail} fallback={<HeroPost post={mainFeaturedFallback} getThumbnail={getThumbnail} />} />
            )}
          </Slot>

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

function ResolvedHero({ id, getThumbnail, fallback }: { id: string | null | undefined; getThumbnail: (post: Post) => string; fallback: React.ReactNode }) {
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", parseInt(id))
        .single();
      if (error) throw error;
      return data as Post;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="aspect-video w-full animate-pulse bg-white/5 rounded-2xl lg:aspect-[21/9] flex items-center justify-center"><Loader2 className="animate-spin text-dem" /></div>;
  if (!post) return <>{fallback}</>;

  return <HeroPost post={post} getThumbnail={getThumbnail} />;
}

function HeroPost({ post, getThumbnail }: { post: Post; getThumbnail: (post: Post) => string }) {
  return (
    <Link
      to={`/post/${post.id}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl lg:aspect-[21/9]"
    >
      <img
        src={getThumbnail(post)}
        alt={post.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 md:p-6">
        <div className="flex items-center gap-3">
          {post.is_featured && (
            <span className="rounded-full bg-dem/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              Featured
            </span>
          )}
          <span className="text-xs uppercase tracking-widest text-white/60">
            {post.content_type}
          </span>
        </div>
        <h2 className="mt-2 font-display text-xl text-white sm:text-2xl md:text-4xl">
          {post.title}
        </h2>
      </div>
    </Link>
  );
}
