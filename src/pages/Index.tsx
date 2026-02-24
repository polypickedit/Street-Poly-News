import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { FeaturedSection } from "@/components/FeaturedSection";
import { InfinitePostFeed } from "@/components/InfinitePostFeed";
import { SuggestionsCarousel } from "@/components/SuggestionsCarousel";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/PageTransition";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipsGrid } from "@/components/ClipsGrid";
import { useSlotContents } from "@/hooks/usePlacements";
import { useAdmin } from "@/hooks/useAdmin";
import { VideoSlotEditor } from "@/components/admin/VideoSlotEditor";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getYouTubeId } from "@/lib/utils";
import { ContentType } from "@/types/cms";

const Index = () => {
  const videoLinks = [
    {
      id: "3PXQSs-FsK4",
      title: "Alabama rapper SlummKidd Tooly - Activate",
      description:
        "From the Street Politician channel videos list.",
      url: "https://www.youtube.com/@STREETPOLY/search?query=Alabama%20rapper%20SlummKidd%20Tooly%20-%20Activate",
      thumbnail: "https://i.ytimg.com/vi/3PXQSs-FsK4/hqdefault.jpg",
    },
    {
      id: "8L44W6wAELs",
      title: "Tampa rapper Tae Bae did 7 years in prison with labels tryna sign him. Wale , Chris Brown , Rhianna",
      description:
        "From the Street Politician channel videos list.",
      url: "https://www.youtube.com/watch?v=8L44W6wAELs",
      thumbnail: "https://i.ytimg.com/vi/8L44W6wAELs/hqdefault.jpg",
    },
    {
      id: "P931DkZ1BG4",
      title: "Fredo Bang Def Jam deal/ Roddy Rich song",
      description:
        "From the Street Politician channel videos list.",
      url: "https://www.youtube.com/watch?v=P931DkZ1BG4",
      thumbnail: "https://i.ytimg.com/vi/P931DkZ1BG4/hqdefault.jpg",
    },
    {
      id: "Uxnw9TANizo",
      title: "Fredo Bang speaks on Bandman Kevo’s tattoo of Kevin Samuels",
      description:
        "From the Street Politician channel videos list.",
      url: "https://www.youtube.com/@STREETPOLY/search?query=Fredo%20Bang%20speaks%20on%20Bandman%20Kevo%E2%80%99s%20tattoo%20of%20Kevin%20Samuels",
      thumbnail: "https://i.ytimg.com/vi/Uxnw9TANizo/hqdefault.jpg",
    },
    {
      id: "uU9fFp5KxWw",
      title: "Louisiana rapper FREDO BANG talks new cereal and big concert with Mulatto",
      description:
        "From the Street Politician channel videos list.",
      url: "https://www.youtube.com/@STREETPOLY/search?query=Louisiana%20rapper%20FREDO%20BANG%20talks%20new%20cereal%20and%20big%20concert%20with%20Mulatto",
      thumbnail: "https://i.ytimg.com/vi/uU9fFp5KxWw/hqdefault.jpg",
    },
    {
      id: "GHXQVsVtFWo",
      title: "How Jack Harlow got his Papa John’s pizza deal?",
      description:
        "From the Street Politician channel videos list.",
      url: "https://www.youtube.com/watch?v=GHXQVsVtFWo",
      thumbnail: "https://i.ytimg.com/vi/GHXQVsVtFWo/hqdefault.jpg",
    },
  ];

  return (
    <PageLayoutWithAds mainClassName="w-full">
      <PageTransition>
        {/* Brand Headline */}
        <div className="py-8 md:py-16 px-4 text-center overflow-hidden">
          <p className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] mb-3 font-body font-bold">
            <span className="text-dem">Street</span>
            <span className="text-rep mx-2">Politics</span>
            <span className="text-dem">Feed</span>
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.1em] md:tracking-[0.3em] uppercase leading-[1.1] md:leading-none flex flex-col sm:block">
            <span className="inline-block">
              <span className="text-dem">Street</span>
              <span className="text-dem">Poly</span>
            </span>
            <span className="text-rep sm:ml-2 font-black">News</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto font-body leading-relaxed px-2">
            Unfiltered stories from the heart of the movement. <br className="hidden md:block" /> Real voices, real impact, real news.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 px-4">
          <Separator className="flex-1 opacity-20" />
          <span className="text-dem text-[10px] md:text-xs font-body uppercase tracking-widest font-black">Featured</span>
          <Separator className="flex-1 opacity-20" />
        </div>

        {/* Featured Section */}
        <FeaturedSection />

        {/* Video Links */}
        <section className="mb-6 md:mb-10 px-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 font-body font-black">
              STREETPOLY NEWS
            </p>
              <h2 className="font-display text-2xl md:text-3xl text-dem font-black uppercase">
                Latest Clips
              </h2>
            </div>
            <a
              href="https://www.youtube.com/@STREETPOLY"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-dem hover:text-dem/80 transition-colors"
            >
              View channel
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div 
            data-slot="home.clips" 
            data-accepts="video"
          >
            <ClipsGrid 
              slotKey="home.clips" 
              fallback={<FallbackClips videoLinks={videoLinks} />} 
            />
          </div>
        </section>

        {/* Posts Feed */}
        <section id="videos" className="pb-8 md:pb-12 px-4">
          <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 mb-6">
            <Separator className="flex-1 opacity-20" />
            <span className="text-dem text-[10px] md:text-xs font-body uppercase tracking-widest font-black">
              Latest Stories
            </span>
            <Separator className="flex-1 opacity-20" />
          </div>
          <InfinitePostFeed />
        </section>

        {/* Suggestions Carousel */}
        <SuggestionsCarousel />
      </PageTransition>
    </PageLayoutWithAds>
  );
};

interface VideoLink {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
}

const FallbackClips = ({ videoLinks }: { videoLinks: VideoLink[] }) => {
  const { isAdminMode, isAdmin: hasAdminAccess } = useAdmin();
  const canEdit = isAdminMode && hasAdminAccess;
  const [editingVideo, setEditingVideo] = useState<VideoLink | null>(null);
  const queryClient = useQueryClient();

  const handleSave = async (data: { url: string; title: string; description: string; thumbnail: string; youtubeId: string }) => {
    if (!editingVideo) return;

    try {
      // 1. Create all posts (including the edited one)
      const postsToCreate = videoLinks.map(video => {
        const isEdited = video.id === editingVideo.id;
        return {
          title: isEdited ? data.title : video.title,
          subtitle: isEdited ? data.description : video.description,
          youtube_id: isEdited ? data.youtubeId : (getYouTubeId(video.url) || video.id),
          thumbnail_url: isEdited ? data.thumbnail : video.thumbnail,
          content_type: 'video' as const,
          created_at: new Date().toISOString()
        };
      });

      const { data: createdPosts, error: postsError } = await supabase
        .from('posts')
        .insert(postsToCreate)
        .select();

      if (postsError) throw postsError;
      if (!createdPosts) throw new Error("No posts returned");

      // 2. Create placements for these posts
      const placementsToCreate = createdPosts.map((post, index) => ({
        slot_key: 'home.clips',
        content_type: 'video' as ContentType,
        content_id: post.id.toString(),
        active: true,
        priority: createdPosts.length - index, // Higher priority first
        device_scope: 'all' as const,
        metadata: {}
      }));

      const { error: placementsError } = await supabase
        .from('content_placements')
        .insert(placementsToCreate);

      if (placementsError) throw placementsError;

      // 3. Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["slot-contents"] });
      await queryClient.invalidateQueries({ queryKey: ["clip-posts"] });
      setEditingVideo(null);
      
    } catch (error) {
      console.error("Error creating placements:", error);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {videoLinks.map((video) => (
          <a
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (canEdit) {
                e.preventDefault();
                setEditingVideo(video);
              }
            }}
            className="group flex flex-col rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-dem hover:shadow-lg relative"
          >
            {canEdit && (
              <div className="absolute top-2 right-2 z-10 bg-black/80 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                Init Slot
              </div>
            )}
            <div className="overflow-hidden rounded-t-2xl bg-muted">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4 flex flex-col gap-2">
              <h3 className="font-display text-xl text-dem font-black uppercase transition-colors group-hover:text-dem">
                {video.title}
              </h3>
              <p className="text-base text-muted-foreground font-body mt-2 line-clamp-2">
                {video.description}
              </p>
              <span className="mt-3 text-sm font-black uppercase tracking-widest text-dem">
                {canEdit ? "Initialize Slot →" : "Watch on YouTube →"}
              </span>
            </div>
          </a>
        ))}
      </div>

      <VideoSlotEditor
        open={!!editingVideo}
        onOpenChange={(open) => !open && setEditingVideo(null)}
        initialUrl={editingVideo?.url || ""}
        initialTitle={editingVideo?.title || ""}
        initialDescription={editingVideo?.description || ""}
        onSave={handleSave}
      />
    </>
  );
};

export default Index;
