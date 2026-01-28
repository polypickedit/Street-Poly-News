import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { FeaturedSection } from "@/components/FeaturedSection";
import { InfinitePostFeed } from "@/components/InfinitePostFeed";
import { SuggestionsCarousel } from "@/components/SuggestionsCarousel";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/PageTransition";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

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
  ];

  return (
    <PageLayoutWithAds>
      <PageTransition>
        {/* Hero Section */}
        <section className="pt-8 md:pt-16 pb-8 md:pb-12">
          <div className="text-center px-4 md:px-6">
            <h1 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-foreground mb-3 md:mb-4 tracking-wide leading-tight">
              <span className="text-dem">STREETPOLY</span> <span className="text-rep">NEWS</span>
            </h1>
            <p className="font-body text-dem text-sm sm:text-lg md:text-xl max-w-2xl mx-auto px-2">
              Unfiltered news from the streets. Real stories, real voices, real impact.
            </p>
            <div className="mt-4 md:mt-6 w-16 md:w-24 h-1 bg-rep mx-auto"></div>
          </div>
        </section>

        {/* Video Links */}
        <section className="mb-6 md:mb-10">
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

          <div className="grid gap-3 md:grid-cols-2">
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

        {/* Divider */}
        <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4">
          <Separator className="flex-1" />
          <span className="text-muted-foreground/40 text-[10px] md:text-xs font-body uppercase tracking-widest">Featured</span>
          <Separator className="flex-1" />
        </div>

        {/* Featured Section */}
        <FeaturedSection />

        {/* Official Store Promo */}
        <section className="py-12 px-4">
          <div className="max-w-screen-xl mx-auto bg-gradient-to-r from-rep/10 to-dem/10 rounded-3xl p-8 md:p-12 border border-border flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
                THE OFFICIAL <span className="text-rep">STREETPOLY</span> STORE
              </h2>
              <p className="font-body text-muted-foreground text-lg max-w-xl">
                Support independent journalism and wear the message. Get exclusive drops, 
                streetwear essentials, and the latest Streetpoly gear.
              </p>
            </div>
            <Link
              to="/merch"
              className="group relative px-10 py-5 bg-rep text-rep-foreground font-display text-xl uppercase tracking-widest rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-center gap-3"
            >
              Visit Store
              <ExternalLink className="w-6 h-6" />
            </Link>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-3 md:gap-4 py-4 md:py-6 mt-2 md:mt-4">
          <Separator className="flex-1" />
          <span className="text-muted-foreground/40 text-[10px] md:text-xs font-body uppercase tracking-widest">Latest</span>
          <Separator className="flex-1" />
        </div>

        {/* Posts Feed */}
        <section id="videos" className="pb-8 md:pb-12">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground mb-6 md:mb-8">
            Latest Stories
          </h2>
          <InfinitePostFeed />
        </section>

        {/* Suggestions Carousel */}
        <SuggestionsCarousel />
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Index;
