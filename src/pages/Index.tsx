import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { FeaturedSection } from "@/components/FeaturedSection";
import { InfinitePostFeed } from "@/components/InfinitePostFeed";
import { SuggestionsCarousel } from "@/components/SuggestionsCarousel";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/PageTransition";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { ClipsGrid } from "@/components/ClipsGrid";
import { useSlotContents } from "@/hooks/usePlacements";

const Index = () => {
  const { data: clipPlacements } = useSlotContents("home.clips");
  const hasDynamicClips = clipPlacements && clipPlacements.length > 0;
  const videoLinks = [
    {
      id: "3PXQSs-FsK4",
      title: "Tampa meets Memphis in ATL BMY Treydawg & Foreign Freckles",
      description:
        "Coalition DJs’ New Music Mondays captures independent energy from BMY Treydawg and Foreign Freckles.",
      url: "https://www.youtube.com/shorts/3PXQSs-FsK4",
      thumbnail: "https://i.ytimg.com/vi/3PXQSs-FsK4/hqdefault.jpg",
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
      id: "uU9fFp5KxWw",
      title: "The Reality of Street Politics: Exclusive Interview",
      description:
        "Deep dive into the intersection of community leadership and street influence.",
      url: "https://www.youtube.com/watch?v=uU9fFp5KxWw",
      thumbnail: "https://i.ytimg.com/vi/uU9fFp5KxWw/hqdefault.jpg",
    },
    {
      id: "V8_Xh4Y4N0c",
      title: "Independent Artists Taking Over the Game",
      description:
        "How the new wave of independent talent is reshaping the music industry landscape.",
      url: "https://www.youtube.com/watch?v=V8_Xh4Y4N0c",
      thumbnail: "https://i.ytimg.com/vi/V8_Xh4Y4N0c/hqdefault.jpg",
    },
    {
      id: "mYm4h_qf0Uo",
      title: "Community Impact: Real Stories from the Movement",
      description:
        "Highlighting the voices that matter and the change being driven from the heart of the city.",
      url: "https://www.youtube.com/watch?v=mYm4h_qf0Uo",
      thumbnail: "https://i.ytimg.com/vi/mYm4h_qf0Uo/hqdefault.jpg",
    },
    {
      id: "zN5-N0o-Gq4",
      title: "The Future of Street Media and News",
      description:
        "Exploring the evolution of grassroots journalism and its role in modern society.",
      url: "https://www.youtube.com/watch?v=zN5-N0o-Gq4",
      thumbnail: "https://i.ytimg.com/vi/zN5-N0o-Gq4/hqdefault.jpg",
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
              <span className="text-rep">Poly</span>
            </span>
            <span className="text-white sm:ml-2">News</span>
          </h1>
          <p className="mt-6 text-white/70 text-sm md:text-lg max-w-2xl mx-auto font-body leading-relaxed px-2">
            Unfiltered stories from the heart of the movement. <br className="hidden md:block" /> Real voices, real impact, real news.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 px-4">
          <Separator className="flex-1 opacity-20" />
          <span className="text-white/40 text-[10px] md:text-xs font-body uppercase tracking-widest font-bold">Featured</span>
          <Separator className="flex-1 opacity-20" />
        </div>

        {/* Featured Section */}
        <FeaturedSection />

        {/* Video Links */}
        <section className="mb-6 md:mb-10 px-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body">
                STREETPOLY NEWS
              </p>
              <h2 className="font-display text-2xl md:text-3xl text-white">
                Latest Clips
              </h2>
            </div>
            <a
              href="https://www.youtube.com/@STREETPOLYNEWS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-white/70 hover:text-white transition-colors"
            >
              View channel
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div 
            data-slot="home.clips" 
            data-accepts="video"
          >
            {hasDynamicClips ? (
              <ClipsGrid slotKey="home.clips" />
            ) : (
              <FallbackClips videoLinks={videoLinks} />
            )}
          </div>
        </section>

        {/* Posts Feed */}
        <section id="videos" className="pb-8 md:pb-12 px-4">
          <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 mb-6">
            <Separator className="flex-1 opacity-20" />
            <span className="text-white/40 text-[10px] md:text-xs font-body uppercase tracking-widest font-bold">
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
  // If we had a mechanism to check if ClipsGrid rendered something, we'd use it here.
  // For now, these only show up if the database is empty or the user hasn't added placements.
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {videoLinks.map((video) => (
        <a
          key={video.id}
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 transition-all hover:-translate-y-0.5 hover:border-dem hover:shadow-lg"
        >
          <div className="overflow-hidden rounded-t-2xl bg-white/5">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-4 flex flex-col gap-2">
            <h3 className="font-display text-lg text-white transition-colors group-hover:text-white">
              {video.title}
            </h3>
            <p className="text-sm text-white/60 font-body mt-2 line-clamp-2">
              {video.description}
            </p>
            <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/70">
              Watch on YouTube →
            </span>
          </div>
        </a>
      ))}
    </div>
  );
};

export default Index;
