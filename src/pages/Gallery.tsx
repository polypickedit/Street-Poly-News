import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { Slot } from "@/components/Slot";
import { InfinitePostFeed } from "@/components/InfinitePostFeed";
import { PostCard } from "@/components/PostCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/hooks/usePosts";
import { Loader2 } from "lucide-react";

const Gallery = () => {
  return (
    <PageLayoutWithAds mainClassName="w-full">
      <PageTransition>
        <div className="px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-4xl md:text-6xl text-white">Gallery Hub</h1>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-body">Visual Stories</p>
          </div>

          <Slot
            slotKey="gallery.main"
            accepts={["gallery"]}
            fallback={<InfinitePostFeed category="gallery" variant="grid" />}
          >
            {(placement) => (
              <ResolvedGallery id={placement?.id} />
            )}
          </Slot>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

function ResolvedGallery({ id }: { id: string | null | undefined }) {
  // If a specific gallery post is assigned to the 'main' slot, we render it specifically.
  // Or if it's a collection, we could handle that here.
  // For Phase 1, we'll just render the single post as a featured item + the feed.
  
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

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-dem" /></div>;
  if (!post) return <InfinitePostFeed category="gallery" variant="grid" />;

  return (
    <div className="space-y-12">
      <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10 p-4 md:p-8">
        <PostCard {...post} variant="featured" />
      </div>
      <div className="pt-12 border-t border-white/5">
        <h2 className="font-display text-2xl text-white/60 mb-8 uppercase tracking-widest">More from the Gallery</h2>
        <InfinitePostFeed category="gallery" variant="grid" />
      </div>
    </div>
  );
}

export default Gallery;
