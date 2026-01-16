import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { CategoryNav } from "@/components/CategoryNav";
import { AdSidebar, MobileAdBanner } from "@/components/AdSidebar";
import { BottomNav } from "@/components/BottomNav";

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
  const TOP_BANNER_HEIGHT = 36; // Breaking news banner height
  const NAVBAR_HEIGHT = 64;
  const CATEGORY_NAV_HEIGHT = 44;
  const baseHeaderHeight = TOP_BANNER_HEIGHT + NAVBAR_HEIGHT;
  const contentPaddingTop = showCategoryNav
    ? baseHeaderHeight + CATEGORY_NAV_HEIGHT
    : baseHeaderHeight;

  return (
    <div className="min-h-screen bg-background pb-20">
      <BreakingNewsBanner />
      <Navbar />
      {showCategoryNav && <CategoryNav />}

      <div
        className="flex justify-center gap-4 lg:gap-6 px-4 sm:px-6 md:px-8"
        style={{ paddingTop: `${contentPaddingTop}px` }}
      >
        <AdSidebar position="left" />

        <main className="flex-1 max-w-6xl min-w-0">
          {/* Mobile/Tablet banner ad at top */}
          {showMobileAd && <MobileAdBanner />}
          {children}
        </main>

        <AdSidebar position="right" />
      </div>

      <BottomNav />
    </div>
  );
};
