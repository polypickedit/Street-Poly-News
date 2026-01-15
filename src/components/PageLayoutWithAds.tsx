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
  return (
    <div className="min-h-screen bg-background pb-20">
      <BreakingNewsBanner />
      <Navbar />
      {showCategoryNav && <CategoryNav />}

      {/* Spacer for fixed elements: breaking banner (36px) + navbar (64px) + category nav (44px) */}
      <div className={showCategoryNav ? "pt-[144px]" : "pt-[100px]"} />

      <div className="flex justify-center gap-4 lg:gap-6 px-3 sm:px-4 md:px-6">
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
