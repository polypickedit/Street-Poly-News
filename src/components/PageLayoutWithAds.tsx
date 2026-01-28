import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { AdSidebar, MobileSquareAd } from "@/components/AdSidebar";
import { AdBanner } from "@/components/AdBanner";
import { BottomNav } from "@/components/BottomNav";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageLayoutWithAdsProps {
  children: ReactNode;
  showAds?: boolean;
  headerContent?: ReactNode;
  mainClassName?: string;
}

export const PageLayoutWithAds = ({
  children,
  showAds = true,
  headerContent,
  mainClassName = "max-w-4xl",
}: PageLayoutWithAdsProps) => {
  const isVisible = useHeaderVisible();
  const isMobile = useIsMobile();

  const getPaddingTop = () => {
    // Mobile: 40 (banner) + 96 (nav top) + 40 (nav bot) = 176px
    // Desktop: 40 (banner) + 128 (nav top) + 50 (nav bot) = 218px
    return isVisible ? (isMobile ? "pt-[176px]" : "pt-[218px]") : "pt-10";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <BreakingNewsBanner />
      <Navbar />

      {headerContent}

      <div
        className={`flex justify-center gap-4 lg:gap-8 px-4 sm:px-6 md:px-8 transition-[padding] duration-300 ease-in-out ${getPaddingTop()}`}
      >
        <div className="hidden lg:flex items-start flex-shrink-0">
          <AdSidebar position="left" />
        </div>

        <main className={`flex-1 min-w-0 ${mainClassName}`}>
          {/* Header Ad Space */}
          {showAds && (
            <div className="mb-12 mt-4">
              <AdBanner />
            </div>
          )}
          
          {showAds && <MobileSquareAd />}
          
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
