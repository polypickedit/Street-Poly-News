import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { StockTicker } from "@/components/StockTicker";
import { PromoSidebar, MobileSquarePromo, MobileSkyscraperPromo } from "@/components/PromoSidebar";
import { PromoBanner } from "@/components/PromoBanner";
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
    <div className="min-h-screen bg-white pb-32">
      <BreakingNewsBanner />
      <Navbar />

      {headerContent}

      <div
        className={`grid grid-cols-1 lg:grid-cols-[260px_minmax(0,56rem)_260px] justify-center gap-4 lg:gap-8 px-4 sm:px-6 md:px-8 transition-[padding] duration-300 ease-in-out ${getPaddingTop()}`}
      >
        <div className="hidden lg:block">
          <PromoSidebar position="left" />
        </div>

        <main className={`min-w-0 w-full flex flex-col items-center`}>
          <div className="w-full flex flex-col items-center">
            {/* Header Promo Space */}
            {showAds && (
              <div className="mb-12 mt-4 w-full">
                <PromoBanner />
              </div>
            )}
            
            {showAds && <MobileSquarePromo />}
            
            <div className="w-full">
              {children}
            </div>

            {/* Footer Promo Space */}
            {showAds && (
              <div className="mt-16 mb-8 w-full">
                <PromoBanner />
              </div>
            )}
          </div>
        </main>

        <div className="hidden lg:block">
          <PromoSidebar position="right" />
        </div>
      </div>

      <BottomNav />
      <StockTicker />
    </div>
  );
};
