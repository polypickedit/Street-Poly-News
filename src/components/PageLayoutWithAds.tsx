import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { CategoryNav } from "@/components/CategoryNav";
import { AdSidebar, MobileAdBanner } from "@/components/AdSidebar";
import { BottomNav } from "@/components/BottomNav";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageLayoutWithAdsProps {
  children: ReactNode;
  showCategoryNav?: boolean;
  showMobileAd?: boolean;
}

export const PageLayoutWithAds = ({
  children,
  showCategoryNav = true,
  showMobileAd = true,
}: PageLayoutWithAdsProps) => {
  const isVisible = useHeaderVisible();
  const isMobile = useIsMobile();

  const getPaddingTop = () => {
    if (!showCategoryNav) {
      return isVisible ? (isMobile ? "pt-[100px]" : "pt-[116px]") : "pt-[36px]";
    }
    return isVisible ? (isMobile ? "pt-[144px]" : "pt-[160px]") : "pt-[80px]";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <BreakingNewsBanner />
      <Navbar />
      {showCategoryNav && <CategoryNav />}

      <div
        className={`flex justify-center gap-0 lg:gap-0 px-0 sm:px-0 md:px-0 transition-[padding] duration-300 ease-in-out ${getPaddingTop()}`}
      >
        <div className="hidden xl:flex items-start">
          <AdSidebar position="left" />
          <div className="w-[1px] self-stretch bg-border/60 ml-6" />
        </div>

        <main className="flex-1 max-w-6xl min-w-0 px-4 sm:px-6 md:px-8">
          {/* Mobile/Tablet banner ad at top */}
          {showMobileAd && <MobileAdBanner />}
          {children}
        </main>

        <div className="hidden xl:flex items-start">
          <div className="w-[1px] self-stretch bg-border/60 mr-6" />
          <AdSidebar position="right" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
