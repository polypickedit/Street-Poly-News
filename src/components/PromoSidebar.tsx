import { Download, Music } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import newMusicMondaysSideBanner from "@/assets/New Music Monday Side banner ad.png";
import stripClubSlotsAd from "@/assets/Strip_Club_Slots_ad-removebg-preview.png";
import streetPolyMerchAd from "@/assets/StreetPolyMerch_Ad.jpeg";

const SUPABASE_URL = "https://duldhllwapsjytdzpjfz.supabase.co";

interface Promo {
  title: string;
  subtitle: string;
  bg: string;
  text: string;
  link?: string;
  isAlbum?: boolean;
  albumArt?: string;
  image?: string;
  affiliateName?: string | null;
  imageClasses?: string;
  scaleClass?: string;
  objectPosition?: string;
}

const mockPromos: { skyscraper: Promo[]; square: Promo[]; banner: Promo[] } = {
  skyscraper: [
    {
      title: "NEW MUSIC MONDAYS",
      subtitle: "Showcase your band or artist",
      bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
      text: "BOOK NOW",
      link: "/booking",
      isAlbum: false,
      image: newMusicMondaysSideBanner,
      affiliateName: null,
      scaleClass: "scale-[1.08]",
      objectPosition: "center",
    },
    {
      title: "STRIP CLUB SLOTS",
      subtitle: "Play Now",
      bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
      text: "BOOK NOW",
      link: "/booking",
      isAlbum: false,
      image: stripClubSlotsAd,
      affiliateName: null,
      scaleClass: "scale-[1.2]",
      objectPosition: "top",
    },
  ],
  square: [
    {
      title: "STREETPOLY MERCH",
      subtitle: "Available Now!",
      bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
      text: "ORDER NOW",
      link: "/merch",
      image: streetPolyMerchAd,
      scaleClass: "scale-100",
    },
    {
      title: "YOUR AD HERE",
      subtitle: "Targeted Audience",
      bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
      text: "LEARN MORE",
    },
    {
      title: "STREETPOLY MERCH",
      subtitle: "Available Now!",
      bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
      text: "ORDER NOW",
      link: "/merch",
      image: streetPolyMerchAd,
      scaleClass: "scale-100",
    },
  ],
  banner: [
    {
      title: "NEW MUSIC MONDAYS",
      subtitle: "Now booking for Monday night spots",
      bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
      text: "BOOK NOW",
      link: "/booking",
      isAlbum: false,
      affiliateName: null,
    },
  ],
};

interface PromoSidebarProps {
  position: "left" | "right";
}

export const PromoSidebar = ({ position }: PromoSidebarProps) => {
  const skyPromo = mockPromos.skyscraper[position === "left" ? 0 : 1];
  const sqPromo = mockPromos.square[position === "left" ? 0 : 2];

  // Fetch affiliate link for tracked promos
  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link", skyPromo.affiliateName],
    queryFn: async () => {
      if (!skyPromo.affiliateName) return null;
      
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, click_count")
        .eq("name", skyPromo.affiliateName)
        .maybeSingle();

      if (error) {
        return null;
      }
      return data;
    },
    enabled: !!skyPromo.affiliateName,
  });

  // Generate tracked URL for affiliate promos
  const getTrackedUrl = () => {
    if (affiliateLink?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${affiliateLink.id}`;
    }
    return skyPromo.link;
  };

  const isInternal = skyPromo.link?.startsWith("/");

  return (
    <aside 
      className="hidden lg:flex flex-col items-center gap-6 sticky top-32 h-fit max-h-[calc(100vh-9rem)] w-[260px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    >
      {/* Skyscraper Promo 260x600 */}
      <div className="relative w-full flex flex-col items-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Promotion
        </span>
        {isInternal ? (
          <Link
            to={skyPromo.link || "#"}
            title={skyPromo.title}
            className={`h-[600px] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${skyPromo.image ? "p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${skyPromo.bg} shadow-lg p-4 text-center border-2 border-muted-foreground/20`}`}
          >
            {skyPromo.image ? (
              <img
                src={skyPromo.image}
                alt={skyPromo.title}
                className={`w-full h-full block object-cover object-${skyPromo.objectPosition ?? 'center'} origin-${skyPromo.objectPosition === 'top' ? 'top' : 'center'} ${skyPromo.scaleClass ?? 'scale-100'}`}
              />
            ) : skyPromo.isAlbum ? (
              <>
                {/* Album artwork */}
                <div className="w-[130px] h-[130px] rounded-lg overflow-hidden mb-4 shadow-xl border-2 border-white/20">
                  <img 
                    src={skyPromo.albumArt} 
                    alt={skyPromo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-foreground/60 font-body text-xs uppercase tracking-wider mb-1">
                  New Album
                </div>
                <div className="text-foreground font-display text-3xl leading-tight mb-1">
                  {skyPromo.title}
                </div>
                <div className="text-foreground/80 font-body text-sm mb-4">
                  {skyPromo.subtitle}
                </div>
                <div className="flex items-center gap-2 bg-dem text-dem-foreground font-display text-sm px-5 py-2.5 rounded-full">
                  <Download className="w-4 h-4" />
                  {skyPromo.text}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-foreground/50 text-xs font-body">
                  <Music className="w-3 h-3" />
                  Stream or Download
                </div>
                {affiliateLink && (
                  <div className="mt-2 text-foreground/30 text-[10px] font-body">
                    {affiliateLink.click_count} clicks
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-foreground/90 font-display text-2xl leading-tight mb-2">
                  {skyPromo.title}
                </div>
                <div className="text-foreground/70 font-body text-sm mb-6">
                  {skyPromo.subtitle}
                </div>
                <div className="bg-foreground text-background font-display text-sm px-6 py-2 rounded-full">
                  {skyPromo.text}
                </div>
              </>
            )}
          </Link>
        ) : (
          <a
            href={getTrackedUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title={skyPromo.title}
            className={`h-[600px] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${skyPromo.image ? "p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${skyPromo.bg} shadow-lg p-4 text-center border-2 border-muted-foreground/20`}`}
          >
            {skyPromo.image ? (
              <img
                src={skyPromo.image}
                alt={skyPromo.title}
                className={`w-full h-full block object-cover object-${skyPromo.objectPosition ?? 'center'} origin-${skyPromo.objectPosition === 'top' ? 'top' : 'center'} ${skyPromo.scaleClass ?? 'scale-100'}`}
              />
            ) : skyPromo.isAlbum ? (
              <>
                {/* Album artwork */}
                <div className="w-[130px] h-[130px] rounded-lg overflow-hidden mb-4 shadow-xl border-2 border-white/20">
                  <img 
                    src={skyPromo.albumArt} 
                    alt={skyPromo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-foreground/60 font-body text-xs uppercase tracking-wider mb-1">
                  New Album
                </div>
                <div className="text-foreground font-display text-3xl leading-tight mb-1">
                  {skyPromo.title}
                </div>
                <div className="text-foreground/80 font-body text-sm mb-4">
                  {skyPromo.subtitle}
                </div>
                <div className="flex items-center gap-2 bg-dem text-dem-foreground font-display text-sm px-5 py-2.5 rounded-full">
                  <Download className="w-4 h-4" />
                  {skyPromo.text}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-foreground/50 text-xs font-body">
                  <Music className="w-3 h-3" />
                  Stream or Download
                </div>
                {affiliateLink && (
                  <div className="mt-2 text-foreground/30 text-[10px] font-body">
                    {affiliateLink.click_count} clicks
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-foreground/90 font-display text-2xl leading-tight mb-2">
                  {skyPromo.title}
                </div>
                <div className="text-foreground/70 font-body text-sm mb-6">
                  {skyPromo.subtitle}
                </div>
                <div className="bg-foreground text-background font-display text-sm px-6 py-2 rounded-full">
                  {skyPromo.text}
                </div>
              </>
            )}
          </a>
        )}
      </div>

      {/* Square Promo 260x260 */}
      <div className="relative w-full flex flex-col items-center text-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Promotion
        </span>
        {sqPromo.link?.startsWith("/") ? (
          <Link
            to={sqPromo.link}
            title={sqPromo.title}
            className={`h-auto rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${sqPromo.image ? "p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${sqPromo.bg} shadow-lg p-4 border-2 border-muted-foreground/20`}`}
          >
            {sqPromo.image ? (
              <img
                src={sqPromo.image}
                alt={sqPromo.title}
                className={`w-full h-auto block object-contain ${sqPromo.scaleClass ?? 'scale-100'}`}
              />
            ) : (
              <>
                <div className="text-foreground/90 font-display text-4xl leading-tight mb-2">
                  {sqPromo.title}
                </div>
                <div className="text-foreground/70 font-body text-sm mb-6">
                  {sqPromo.subtitle}
                </div>
                <div className="bg-foreground text-background font-display text-sm px-6 py-2 rounded-full">
                  {sqPromo.text}
                </div>
              </>
            )}
          </Link>
        ) : (
          <a
            href={sqPromo.link || "#"}
            target={sqPromo.link ? "_blank" : undefined}
            rel={sqPromo.link ? "noopener noreferrer" : undefined}
            title={sqPromo.title}
            className={`h-auto rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${sqPromo.image ? "p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${sqPromo.bg} shadow-lg p-4 border-2 border-muted-foreground/20`}`}
          >
            {sqPromo.image ? (
              <img
                src={sqPromo.image}
                alt={sqPromo.title}
                className={`w-full h-auto block object-contain ${sqPromo.scaleClass ?? 'scale-100'}`}
              />
            ) : (
              <>
                <div className="text-foreground/90 font-display text-4xl leading-tight mb-2">
                  {sqPromo.title}
                </div>
                <div className="text-foreground/70 font-body text-sm mb-6">
                  {sqPromo.subtitle}
                </div>
                <div className="bg-foreground text-background font-display text-sm px-6 py-2 rounded-full">
                  {sqPromo.text}
                </div>
              </>
            )}
          </a>
        )}
      </div>
    </aside>
  );
};

// Mobile/Tablet horizontal banner promo component
export const MobilePromoBanner = () => {
  const bannerPromo = mockPromos.banner[0];

  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link-mobile", bannerPromo.affiliateName],
    queryFn: async () => {
      if (!bannerPromo.affiliateName) return null;
      
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, click_count")
        .eq("name", bannerPromo.affiliateName)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!bannerPromo.affiliateName,
  });

  const getTrackedUrl = () => {
    if (affiliateLink?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${affiliateLink.id}`;
    }
    return bannerPromo.link || "#";
  };

  const isInternal = bannerPromo.link?.startsWith("/");

  return (
    <div className="xl:hidden my-6">
      <div className="relative">
        <span className="absolute top-[3%] left-0 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Promotion
        </span>
        {isInternal ? (
          <Link
            to={bannerPromo.link || "#"}
            className={`w-full h-20 md:h-24 bg-gradient-to-r ${bannerPromo.bg} rounded-lg flex items-center justify-between px-4 md:px-6 cursor-pointer hover:scale-[1.01] transition-transform shadow-lg border-2 border-muted-foreground/20`}
          >
            <div className="flex items-center gap-3 md:gap-4">
              {bannerPromo.isAlbum && (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shadow-xl border-2 border-white/20 flex-shrink-0">
                  <img 
                    src={bannerPromo.albumArt} 
                    alt={bannerPromo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="text-foreground/60 font-body text-[10px] uppercase tracking-wider">
                  New Album
                </div>
                <div className="text-foreground font-display text-xl md:text-2xl leading-tight">
                  {bannerPromo.title}
                </div>
                <div className="text-foreground/70 font-body text-xs">
                  {bannerPromo.subtitle}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-foreground text-background font-display text-xs md:text-sm px-4 py-2 rounded-full flex-shrink-0">
              {bannerPromo.text}
            </div>
          </Link>
        ) : (
          <a
            href={getTrackedUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full h-20 md:h-24 bg-gradient-to-r ${bannerPromo.bg} rounded-lg flex items-center justify-between px-4 md:px-6 cursor-pointer hover:scale-[1.01] transition-transform shadow-lg border-2 border-muted-foreground/20`}
          >
            <div className="flex items-center gap-3 md:gap-4">
              {bannerPromo.isAlbum && (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shadow-xl border-2 border-white/20 flex-shrink-0">
                  <img 
                    src={bannerPromo.albumArt} 
                    alt={bannerPromo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="text-foreground/60 font-body text-[10px] uppercase tracking-wider">
                  New Album
                </div>
                <div className="text-foreground font-display text-xl md:text-2xl leading-tight">
                  {bannerPromo.title}
                </div>
                <div className="text-foreground/70 font-body text-xs">
                  {bannerPromo.subtitle}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-foreground text-background font-display text-xs md:text-sm px-4 py-2 rounded-full flex-shrink-0">
              {bannerPromo.text}
            </div>
          </a>
        )}
      </div>
    </div>
  );
};

export const MobileSkyscraperPromo = ({ index = 0 }: { index?: number }) => {
  const skyPromo = mockPromos.skyscraper[index];

  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link-mobile-sky", skyPromo.affiliateName, index],
    queryFn: async () => {
      if (!skyPromo.affiliateName) return null;
      
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, click_count")
        .eq("name", skyPromo.affiliateName)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!skyPromo.affiliateName,
  });

  const getTrackedUrl = () => {
    if (affiliateLink?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${affiliateLink.id}`;
    }
    return skyPromo.link;
  };

  const isInternal = skyPromo.link?.startsWith("/");

  const PromoContent = () => (
    <>
      {skyPromo.image ? (
        <img
          src={skyPromo.image}
          alt={skyPromo.title}
          className={`w-full h-auto block object-contain`}
        />
      ) : skyPromo.isAlbum ? (
        <>
          <div className="w-[130px] h-[130px] rounded-lg overflow-hidden mb-4 shadow-xl border-2 border-white/20">
            <img 
              src={skyPromo.albumArt} 
              alt={skyPromo.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-foreground/60 font-body text-xs uppercase tracking-wider mb-1">
            New Album
          </div>
          <div className="text-foreground font-display text-3xl leading-tight mb-1">
            {skyPromo.title}
          </div>
          <div className="text-foreground/80 font-body text-sm mb-4">
            {skyPromo.subtitle}
          </div>
          <div className="flex items-center gap-2 bg-dem text-dem-foreground font-display text-sm px-5 py-2.5 rounded-full">
            <Download className="w-4 h-4" />
            {skyPromo.text}
          </div>
        </>
      ) : (
        <>
          <div className="text-foreground/90 font-display text-2xl leading-tight mb-2">
            {skyPromo.title}
          </div>
          <div className="text-foreground/70 font-body text-sm mb-6">
            {skyPromo.subtitle}
          </div>
          <div className="bg-foreground text-background font-display text-sm px-6 py-2 rounded-full">
            {skyPromo.text}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="lg:hidden w-full my-6 flex justify-center">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Promotion
        </span>
        {isInternal ? (
          <Link
            to={skyPromo.link || "#"}
            title={skyPromo.title}
            className={`rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${skyPromo.image ? "h-auto p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${skyPromo.bg} shadow-lg p-4 text-center border-2 border-muted-foreground/20`}`}
          >
            <PromoContent />
          </Link>
        ) : (
          <a
            href={getTrackedUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title={skyPromo.title}
            className={`rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${skyPromo.image ? "h-auto p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${skyPromo.bg} shadow-lg p-4 text-center border-2 border-muted-foreground/20`}`}
          >
            <PromoContent />
          </a>
        )}
      </div>
    </div>
  );
};


export const MobileSquarePromo = () => {
  const sqPromo = mockPromos.square[0];
  const isInternal = sqPromo.link?.startsWith("/");

  const PromoContent = () => (
    <>
      {sqPromo.image ? (
        <img
          src={sqPromo.image}
          alt={sqPromo.title}
          className="object-contain w-full h-auto block"
        />
      ) : (
        <>
          <div className="text-foreground/90 font-display text-xl leading-tight mb-2">
            {sqPromo.title}
          </div>
          <div className="text-foreground/70 font-body text-xs mb-4">
            {sqPromo.subtitle}
          </div>
          <div className="bg-foreground text-background font-display text-xs px-4 py-1.5 rounded-full">
            {sqPromo.text}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="lg:hidden w-full my-6 flex justify-center">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Promotion
        </span>
        {isInternal ? (
          <Link
            to={sqPromo.link || "#"}
            title={sqPromo.title}
            className={`rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${sqPromo.image ? "h-auto p-0 overflow-hidden border-0 bg-transparent" : `aspect-square bg-gradient-to-b ${sqPromo.bg} shadow-lg p-4 text-center border-2 border-muted-foreground/20`}`}
          >
            <PromoContent />
          </Link>
        ) : (
          <a
            href={sqPromo.link || "#"}
            target={sqPromo.link ? "_blank" : undefined}
            rel={sqPromo.link ? "noopener noreferrer" : undefined}
            title={sqPromo.title}
            className={`rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${sqPromo.image ? "h-auto p-0 overflow-hidden border-0 bg-transparent" : `aspect-square bg-gradient-to-b ${sqPromo.bg} shadow-lg p-4 text-center border-2 border-muted-foreground/20`}`}
          >
            <PromoContent />
          </a>
        )}
      </div>
    </div>
  );
};

