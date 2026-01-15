import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/PostCard";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";

const Category = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["category-posts", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_categories")
        .select(`
          post_id,
          posts (*)
        `)
        .eq("category_id", category?.id);

      if (error) throw error;
      return data.map((pc: any) => pc.posts).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!category?.id,
  });

  const isLoading = categoryLoading || postsLoading;

  if (isLoading) {
    return (
      <PageLayoutWithAds>
        <div className="flex justify-center items-center pt-40">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </PageLayoutWithAds>
    );
  }

  if (!category) {
    return (
      <PageLayoutWithAds>
        <div className="pt-40 text-center">
          <h1 className="font-display text-4xl text-foreground mb-4">Category Not Found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return Home
          </Link>
        </div>
      </PageLayoutWithAds>
    );
  }

  return (
    <PageLayoutWithAds>
      <div className="pt-4 pb-16 md:pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-body text-xs sm:text-sm uppercase tracking-wider">Back to Home</span>
        </Link>

        {/* Category Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
          <div
            className="w-1.5 md:w-2 h-10 md:h-12 rounded"
            style={{ backgroundColor: category.color }}
          />
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground">
            {category.name}
          </h1>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 mb-4 md:mb-6">
          <Separator className="flex-1" style={{ backgroundColor: `${category.color}30` }} />
          <span 
            className="text-[10px] md:text-xs font-body uppercase tracking-widest"
            style={{ color: category.color }}
          >
            {posts?.length || 0} {posts?.length === 1 ? 'Story' : 'Stories'}
          </span>
          <Separator className="flex-1" style={{ backgroundColor: `${category.color}30` }} />
        </div>

        {posts?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {posts.map((post: any) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                subtitle={post.subtitle}
                youtube_id={post.youtube_id}
                thumbnail_url={post.thumbnail_url}
                created_at={post.created_at}
                content_type={post.content_type}
                is_breaking={post.is_breaking}
                is_featured={post.is_featured}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground font-body text-center py-10 md:py-12">
            No posts in this category yet.
          </p>
        )}
      </div>
    </PageLayoutWithAds>
  );
};

export default Category;
