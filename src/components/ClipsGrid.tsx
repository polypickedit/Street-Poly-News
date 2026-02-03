import React from "react";
import { useSlotContents } from "@/hooks/usePlacements";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/hooks/usePosts";
import { Loader2 } from "lucide-react";
import { getYouTubeId } from "@/lib/utils";

interface ClipsGridProps {
  slotKey: string;
}

export function ClipsGrid({ slotKey }: ClipsGridProps) {
  const { data: placements, isLoading: loadingPlacements } = useSlotContents(slotKey);

  const { data: clipPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ["clip-posts", placements?.map(p => p.content_id)],
    queryFn: async () => {
      if (!placements || placements.length === 0) return [];
      
      const ids = placements.map(p => parseInt(p.content_id!)).filter(id => !isNaN(id));
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .in("id", ids);

      if (error) throw error;
      
      // Preserve placement order (priority desc)
      return (data as Post[]).sort((a, b) => {
        const priorityA = placements.find(p => p.content_id === a.id.toString())?.priority || 0;
        const priorityB = placements.find(p => p.content_id === b.id.toString())?.priority || 0;
        return priorityB - priorityA;
      });
    },
    enabled: !!placements?.length,
  });

  if (loadingPlacements || loadingPosts) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-dem" />
      </div>
    );
  }

  // If no placements, we'll return null and let the parent handle the hardcoded fallback
  if (!clipPosts || clipPosts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {clipPosts.map((post) => (
        <a
          key={post.id}
          href={`https://www.youtube.com/watch?v=${post.youtube_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col rounded-2xl border border-white/10 bg-card/80 transition-all hover:-translate-y-0.5 hover:border-dem hover:shadow-lg"
        >
          <div className="overflow-hidden rounded-t-2xl bg-muted/30 aspect-video">
            <img
              src={post.thumbnail_url || `https://i.ytimg.com/vi/${getYouTubeId(post.youtube_id)}/hqdefault.jpg`}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-4 flex flex-col gap-2">
            <h3 className="font-display text-lg text-foreground transition-colors group-hover:text-white line-clamp-2">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground font-body line-clamp-2">
              {post.subtitle || "Latest clips from the heart of the city."}
            </p>
            <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/70">
              Watch on YouTube →
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
