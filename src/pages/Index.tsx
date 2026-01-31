import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { FeaturedSection } from "@/components/FeaturedSection";
import { InfinitePostFeed } from "@/components/InfinitePostFeed";
import { SuggestionsCarousel } from "@/components/SuggestionsCarousel";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/PageTransition";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import streetPolyMerchAd from "@/assets/StreetPolyMerch_Ad.jpeg";

const Index = () => {
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
        {/* Brand Headline */}
        <div className="py-8 md:py-16 px-4 text-center">
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] mb-3 font-body font-bold">
            <span className="text-dem">Street</span>
            <span className="text-rep mx-2">Politics</span>
            <span className="text-dem">Feed</span>
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.3em] uppercase leading-none">
            <span className="text-dem">Street</span>
            <span className="text-rep">Poly</span>
            <span className="text-foreground ml-2">News</span>
          </h1>
          <p className="mt-6 text-muted-foreground/80 text-sm md:text-lg max-w-2xl mx-auto font-body leading-relaxed">
            Unfiltered stories from the heart of the movement. <br className="hidden md:block" /> Real voices, real impact, real news.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 px-4">
          <Separator className="flex-1" />
          <span className="text-muted-foreground/40 text-[10px] md:text-xs font-body uppercase tracking-widest">Featured</span>
          <Separator className="flex-1" />
        </div>

        {/* Featured Section */}
        <FeaturedSection />

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

        {/* Posts Feed */}
        <section id="videos" className="pb-8 md:pb-12 px-4">
          <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 mb-6">
            <Separator className="flex-1" />
            <span className="text-muted-foreground/40 text-[10px] md:text-xs font-body uppercase tracking-widest">
              Latest Stories
            </span>
            <Separator className="flex-1" />
          </div>
          <InfinitePostFeed />
        </section>

        {/* Suggestions Carousel */}
        <SuggestionsCarousel />
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Index;
