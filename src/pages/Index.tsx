import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { FeaturedSection } from "@/components/FeaturedSection";
import { InfinitePostFeed } from "@/components/InfinitePostFeed";
import { SuggestionsCarousel } from "@/components/SuggestionsCarousel";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/PageTransition";

const Index = () => {
  return (
    <PageLayoutWithAds showMobileAd={false}>
      <PageTransition>
        {/* Hero Section */}
        <section className="pt-8 md:pt-16 pb-8 md:pb-12">
          <div className="text-center px-4 md:px-6">
            <h1 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-foreground mb-3 md:mb-4 tracking-wide leading-tight">
              <span className="text-dem">STREETPOLY</span> <span className="text-rep">NEWS</span>
            </h1>
            <p className="font-body text-muted-foreground text-sm sm:text-lg md:text-xl max-w-2xl mx-auto px-2">
              Unfiltered news from the streets. Real stories, real voices, real impact.
            </p>
            <div className="mt-4 md:mt-6 w-16 md:w-24 h-1 bg-rep mx-auto"></div>
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
