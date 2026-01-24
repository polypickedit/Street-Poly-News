import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { AdSidebar } from "@/components/AdSidebar";
import { AdBanner } from "@/components/AdBanner";
import { BottomNav } from "@/components/BottomNav";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageLayoutWithAdsProps {
  children: ReactNode;
  showAds?: boolean;
}

export const PageLayoutWithAds = ({
  children,
  showAds = true,
}: PageLayoutWithAdsProps) => {
  const isVisible = useHeaderVisible();
  const isMobile = useIsMobile();

  const getPaddingTop = () => {
    return isVisible ? (isMobile ? "pt-[132px]" : "pt-[164px]") : "pt-[36px]";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <BreakingNewsBanner />
      <Navbar />

      <div
        className={`flex justify-center gap-4 lg:gap-8 px-4 sm:px-6 md:px-8 transition-[padding] duration-300 ease-in-out ${getPaddingTop()}`}
      >
        <div className="hidden lg:flex items-start flex-shrink-0">
          <AdSidebar position="left" />
        </div>

        <main className="flex-1 max-w-4xl min-w-0">
          {/* Header Ad Space */}
          {showAds && (
            <div className="mb-12 mt-4">
              <AdBanner />
            </div>
          )}
          
          {children}

          {/* Footer Ad Space */}
          {showAds && (
            <div className="mt-16 mb-8">
              <AdBanner />
            </div>
          )}
        </main>

        <div className="hidden lg:flex items-start flex-shrink-0">
          <AdSidebar position="right" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
