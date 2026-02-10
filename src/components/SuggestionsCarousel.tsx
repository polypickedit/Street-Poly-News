import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { getYouTubeId } from "@/lib/utils";
import { useSlotContents } from "@/hooks/usePlacements";

export const SuggestionsCarousel = () => {
  const { data: placements, isLoading: loadingPlacements } = useSlotContents("home.trending");

  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ["suggested-posts", placements?.map(p => p.content_id)],
    queryFn: async ({ signal }) => {
      try {
        // If we have specific placements, fetch them
        if (placements && placements.length > 0) {
          const ids = placements.map(p => parseInt(p.content_id!)).filter(id => !isNaN(id));
          if (ids.length > 0) {
            const query = supabase
              .from("posts")
              .select("id, title, youtube_id, thumbnail_url")
              .in("id", ids) as unknown as { 
                abortSignal: (s: AbortSignal) => Promise<{ 
                  data: { id: number; title: string; youtube_id: string | null; thumbnail_url: string | null }[] | null; 
                  error: { message: string; code: string } | null 
                }> 
              };
            
            const { data, error } = await query.abortSignal(signal);
            if (error) throw error;
            return data;
          }
        }

        // Fallback: Top 10 by views
        const query = supabase
          .from("posts")
          .select("id, title, youtube_id, thumbnail_url")
          .order("view_count", { ascending: false })
          .limit(10) as unknown as { 
            abortSignal: (s: AbortSignal) => Promise<{ 
              data: { id: number; title: string; youtube_id: string | null; thumbnail_url: string | null }[] | null; 
              error: { message: string; code: string } | null 
            }> 
          };

        const { data, error } = await query.abortSignal(signal);

        if (error) throw error;
        return data;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return null;
        }
        throw err;
      }
    },
    enabled: !loadingPlacements,
  });

  if (loadingPlacements || loadingPosts) {
    return (
      <div className="py-6 sm:py-8">
        <h2 className="text-lg sm:text-xl font-display font-bold mb-4 text-dem">
          Suggested For You
        </h2>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-48 h-32 rounded-lg flex-shrink-0 bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!posts?.length) return null;

  return (
    <div 
      data-slot="home.trending" 
      data-accepts="video,article"
      className="py-6 sm:py-8 border-t border-white/10"
    >
      <h2 className="text-lg sm:text-xl font-display font-bold mb-4 text-dem">
        Suggested For You
      </h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {posts.map((post) => (
            <CarouselItem
              key={post.id}
              className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
            >
              <Link
                to={`/post/${post.id}`}
                className="group block relative overflow-hidden rounded-lg aspect-video shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={
                    post.thumbnail_url ||
                    (getYouTubeId(post.youtube_id) 
                      ? `https://img.youtube.com/vi/${getYouTubeId(post.youtube_id)}/hqdefault.jpg`
                      : "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=60")
                  }
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-white/40 group-hover:bg-white/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight group-hover:underline drop-shadow-sm">
                    {post.title}
                  </h3>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-4 bg-white/80 backdrop-blur-sm border-black/10 text-black hover:bg-dem hover:text-white" />
        <CarouselNext className="hidden sm:flex -right-4 bg-white/80 backdrop-blur-sm border-black/10 text-black hover:bg-dem hover:text-white" />
      </Carousel>
    </div>
  );
};
