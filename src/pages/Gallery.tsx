import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";

const Gallery = () => {
  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="container mx-auto px-4 py-12">
          <h1 className="font-display text-4xl md:text-6xl text-foreground mb-8">Gallery</h1>
          <p className="font-body text-lg text-muted-foreground">Coming soon...</p>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Gallery;
