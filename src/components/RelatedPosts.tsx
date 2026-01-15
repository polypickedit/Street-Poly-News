import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "./PostCard";

interface RelatedPostsProps {
  currentPostId: number;
}

export function RelatedPosts({ currentPostId }: RelatedPostsProps) {
  const { data: posts } = useQuery({
    queryKey: ["related-posts", currentPostId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .neq("id", currentPostId)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  if (!posts?.length) return null;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="font-display text-xl text-foreground mb-4">More Stories</h3>
      <div className="space-y-2">
        {posts.map((post) => (
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
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}