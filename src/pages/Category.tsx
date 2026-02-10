import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/PostCard";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import { Post } from "@/hooks/usePosts";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async ({ signal }) => {
      try {
        const query = supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .maybeSingle() as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: CategoryData | null; error: { code: string; message: string } | null }> };

        const result = await query.abortSignal(signal);
        const data = result.data;
        const error = result.error;

        if (error) throw error;
        return data;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (containerRef.current && category?.color) {
      containerRef.current.style.setProperty("--bg-color", category.color);
    }
  }, [category?.color]);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["category-posts", category?.id],
    queryFn: async ({ signal }) => {
      try {
        const query = supabase
          .from("post_categories")
          .select(`
            post_id,
            posts (*)
          `)
          .eq("category_id", category?.id) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: { posts: Post }[] | null; error: { code: string; message: string } | null }> };

        const result = await query.abortSignal(signal);
        const data = result.data;
        const error = result.error;

        if (error) throw error;
        
        const categoryPosts = data || [];
        return categoryPosts
          .map((pc) => pc.posts)
          .filter((post): post is Post => post !== null)
          .sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
    enabled: !!category?.id,
  });

  const isLoading = categoryLoading || postsLoading;

  if (isLoading) {
    return (
      <PageLayoutWithAds>
        <div className="flex justify-center items-center pt-40">
          <Loader2 className="w-8 h-8 text-dem animate-spin" />
        </div>
      </PageLayoutWithAds>
    );
  }

  if (!category) {
    return (
      <PageLayoutWithAds>
        <div className="pt-40 text-center">
          <h1 className="font-display text-4xl text-dem mb-4">Category Not Found</h1>
          <Link to="/" className="text-dem hover:underline">
            Return Home
          </Link>
        </div>
      </PageLayoutWithAds>
    );
  }

  return (
    <PageLayoutWithAds>
      <div 
        ref={containerRef}
        className="pt-4 pb-16 md:pb-20 text-foreground"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-dem transition-colors mb-4 md:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-body text-xs sm:text-sm uppercase tracking-wider">Back to Home</span>
        </Link>

        {/* Category Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
          <div 
            className="w-1.5 h-6 md:h-8 bg-[var(--bg-color, theme(colors.dem))] "
          />
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-dem">
            {category.name}
          </h1>
        </div>

        <Separator className="mb-6 md:mb-10 bg-border" />

        {/* Category Posts */}
        {posts?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {posts.map((post: Post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                subtitle={post.subtitle}
                youtube_id={post.youtube_id}
                thumbnail_url={post.thumbnail_url}
                created_at={post.created_at}
                content_type={post.content_type}
                is_breaking={post.is_breaking ?? undefined}
                is_featured={post.is_featured ?? undefined}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground font-body text-sm sm:text-base">No stories found in this category.</p>
        )}
      </div>
    </PageLayoutWithAds>
  );
};

export default Category;
