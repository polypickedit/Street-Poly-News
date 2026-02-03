import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "./PostCard";
import { useSlotContents } from "@/hooks/usePlacements";
import { Post } from "@/hooks/usePosts";

interface RelatedPostsProps {
  currentPostId: number;
}

export function RelatedPosts({ currentPostId }: RelatedPostsProps) {
  const { data: placements, isLoading: loadingPlacements } = useSlotContents("post.related");

  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ["related-posts", currentPostId, placements?.map(p => p.content_id)],
    queryFn: async () => {
      // If we have specific placements for this slot, fetch them
      if (placements && placements.length > 0) {
        const ids = placements.map(p => parseInt(p.content_id!)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          const { data, error } = await supabase
            .from("posts")
            .select("*")
            .in("id", ids);
          if (error) throw error;
          return data as Post[];
        }
      }

      // Fallback: Latest stories excluding current
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .neq("id", currentPostId)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as Post[];
    },
    enabled: !loadingPlacements,
  });

  if (!posts?.length) return null;

  return (
    <div 
      data-slot="post.related" 
      data-accepts="video,article"
      className="bg-card rounded-2xl p-6 border border-border"
    >
      <h3 className="font-display text-xl text-foreground mb-4">More Stories</h3>
      <div className="space-y-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            {...post}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}