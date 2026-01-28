import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { FeaturedSection } from "@/components/FeaturedSection";
import { PostCard } from "@/components/PostCard";
import { AdBanner } from "@/components/AdBanner";
import { SuggestionsCarousel } from "@/components/SuggestionsCarousel";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/PageTransition";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import streetPolyMerchAd from "@/assets/StreetPolyMerch_Ad.jpeg";

const Index = () => {
  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(18);
      if (error) throw error;
      return data;
    },
  });
  const videoLinks = [
    {
      id: "3PXQSs-FsK4",
      title: "Tampa meets Memphis in ATL BMY Treydawg & Foreign Freckles",
      description:
        "Coalition DJs’ New Music Mondays captures independent energy from BMY Treydawg and Foreign Freckles.",
      url: "https://www.youtube.com/shorts/3PXQSs-FsK4",
      thumbnail: "https://i4.ytimg.com/vi/3PXQSs-FsK4/hqdefault.jpg",
    },
    {
      id: "Uxnw9TANizo",
      title: "@superspodeeotm Opens Up: The Dark Truth About Designer Drugs",
      description:
        "Spodee breaks down addiction, sobriety, and why raw storytelling matters in the streets.",
      url: "https://www.youtube.com/watch?v=Uxnw9TANizo",
      thumbnail: "https://i.ytimg.com/vi/Uxnw9TANizo/hqdefault.jpg",
    },
    {
      id: "video3",
      title: "New Video Title 3",
      description: "Description for new video 3.",
      url: "https://www.youtube.com/watch?v=video3",
      thumbnail: "https://i.ytimg.com/vi/3PXQSs-FsK4/hqdefault.jpg",
    },
    {
      id: "video4",
      title: "New Video Title 4",
      description: "Description for new video 4.",
      url: "https://www.youtube.com/watch?v=video4",
      thumbnail: "https://i.ytimg.com/vi/Uxnw9TANizo/hqdefault.jpg",
    },
    {
      id: "video5",
      title: "New Video Title 5",
      description: "Description for new video 5.",
      url: "https://www.youtube.com/watch?v=video5",
      thumbnail: "https://i.ytimg.com/vi/3PXQSs-FsK4/hqdefault.jpg",
    },
    {
      id: "video6",
      title: "New Video Title 6",
      description: "Description for new video 6.",
      url: "https://www.youtube.com/watch?v=video6",
      thumbnail: "https://i.ytimg.com/vi/Uxnw9TANizo/hqdefault.jpg",
    },
    {
      id: "video7",
      title: "New Video Title 7",
      description: "Description for new video 7.",
      url: "https://www.youtube.com/watch?v=video7",
      thumbnail: "https://i.ytimg.com/vi/3PXQSs-FsK4/hqdefault.jpg",
    },
    {
      id: "video8",
      title: "New Video Title 8",
      description: "Description for new video 8.",
      url: "https://www.youtube.com/watch?v=video8",
      thumbnail: "https://i.ytimg.com/vi/Uxnw9TANizo/hqdefault.jpg",
    },
    {
      id: "video9",
      title: "New Video Title 9",
      description: "Description for new video 9.",
      url: "https://www.youtube.com/watch?v=video9",
      thumbnail: "https://i.ytimg.com/vi/3PXQSs-FsK4/hqdefault.jpg",
    },
  ];

  return (
    <PageLayoutWithAds mainClassName="w-full">
      <PageTransition>
        {/* Divider */}
        <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 px-4">
          <Separator className="flex-1" />
          <span className="text-muted-foreground/40 text-[10px] md:text-xs font-body uppercase tracking-widest">Featured</span>
          <Separator className="flex-1" />
        </div>

        {/* Featured Section */}
        <FeaturedSection />

        {/* Ad Banner */}
        <div className="my-8 md:my-12 px-4">
          <AdBanner />
        </div>

        {/* Video Links */}
        <section className="mb-6 md:mb-10 px-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-body">
                STREETPOLY NEWS
              </p>
              <h2 className="font-display text-2xl md:text-3xl text-foreground">
                Latest Clips
              </h2>
            </div>
            <a
              href="https://www.youtube.com/@STREETPOLYNEWS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-dem hover:text-dem-foreground transition-colors"
            >
              View channel
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {videoLinks.map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-border bg-card/80 transition-all hover:-translate-y-0.5 hover:border-dem hover:shadow-lg"
              >
                <div className="overflow-hidden rounded-t-2xl bg-muted/30">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-display text-lg text-foreground transition-colors group-hover:text-dem">
                    {video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body mt-2">
                    {video.description}
                  </p>
                  <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-dem">
                    Watch on YouTube →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Official Store Promo */}
        <section className="bg-card border border-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-6 md:mb-10 px-4">
          <div className="flex-1">
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Rep the Movement
            </h2>
            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Get the official Street Politics gear. Hoodies, tees, and more
              available now.
            </p>
            <Link
              to="/merch"
              className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold w-fit hover:bg-primary/90 transition-colors"
            >
              Shop the Store
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
            <img
              src={streetPolyMerchAd}
              alt="Street Politics merchandise"
              className="w-full h-full object-contain"
            />
          </div>
        </section>

        <div className="my-8 md:my-12 px-4">
          <AdBanner />
        </div>

        {/* Latest Stories Title */}
        <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 px-4">
          <Separator className="flex-1" />
          <span className="text-muted-foreground/40 text-[10px] md:text-xs font-body uppercase tracking-widest">
            Latest Stories
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Posts Feed */}
        <section id="videos" className="pb-8 md:pb-12 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {posts.slice(0, 9).map((post, index) => (
              <div 
                key={post.id}
                className={`animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-${Math.min(index, 10)}`}
              >
                <PostCard {...post} />
              </div>
            ))}
          </div>

          <div className="my-8 md:my-12">
            <AdBanner />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {posts.slice(9, 18).map((post, index) => (
              <div 
                key={post.id}
                className={`animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-${Math.min(index, 10)}`}
              >
                <PostCard {...post} />
              </div>
            ))}
          </div>
        </section>

        {/* Suggestions Carousel */}
        <SuggestionsCarousel />
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Index;
