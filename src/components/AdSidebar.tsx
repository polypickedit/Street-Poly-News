import { Download, Music } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import newMusicMondaysSideBanner from "@/assets/New Music Monday Side banner ad.png";
import stripClubSlotsAd from "@/assets/Strip_Club_Slots_ad-removebg-preview.png";
import streetPolyMerchAd from "@/assets/StreetPolyMerch_Ad.jpeg";

const SUPABASE_URL = "https://duldhllwapsjytdzpjfz.supabase.co";

interface Ad {
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

const mockAds: { skyscraper: Ad[]; square: Ad[]; banner: Ad[] } = {
  skyscraper: [
    {
      title: "NEW MUSIC MONDAYS",
      subtitle: "Showcase your band or artist",
      bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
      text: "BOOK NOW",
      link: "https://www.istaybooked.com",
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
      text: "PLAY NOW",
      link: "/advertise",
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
      link: "https://www.istaybooked.com",
      isAlbum: false,
      affiliateName: null,
    },
  ],
};

interface AdSidebarProps {
  position: "left" | "right";
}

export const AdSidebar = ({ position }: AdSidebarProps) => {
  const skyAd = mockAds.skyscraper[position === "left" ? 0 : 1];
  const sqAd = mockAds.square[position === "left" ? 0 : 2];

  // Fetch affiliate link for tracked ads
  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link", skyAd.affiliateName],
    queryFn: async () => {
      if (!skyAd.affiliateName) return null;
      
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, click_count")
        .eq("name", skyAd.affiliateName)
        .maybeSingle();

      if (error) {
        return null;
      }
      return data;
    },
    enabled: !!skyAd.affiliateName,
  });

  // Generate tracked URL for affiliate ads
  const getTrackedUrl = () => {
    if (affiliateLink?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${affiliateLink.id}`;
    }
    return skyAd.link;
  };

  return (
    <aside 
      className="hidden lg:flex flex-col items-center gap-6 sticky top-32 h-fit max-h-[calc(100vh-9rem)] w-[260px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    >
      {/* Skyscraper Ad 260x600 */}
      <div className="relative w-full flex flex-col items-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Advertisement
        </span>
        <a
          href={getTrackedUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`h-[600px] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${skyAd.image ? "p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${skyAd.bg} shadow-lg p-4 text-center border-2 border-dashed border-muted-foreground/20`}`}
        >
          {skyAd.image ? (
            <img
              src={skyAd.image}
              alt={skyAd.title}
              className={`w-full h-full block object-cover object-${skyAd.objectPosition ?? 'center'} origin-${skyAd.objectPosition === 'top' ? 'top' : 'center'} ${skyAd.scaleClass ?? 'scale-100'}`}
            />
          ) : skyAd.isAlbum ? (
            <>
              {/* Album artwork */}
              <div className="w-[130px] h-[130px] rounded-lg overflow-hidden mb-4 shadow-xl border-2 border-white/20">
                <img 
                  src={skyAd.albumArt} 
                  alt={skyAd.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-foreground/60 font-body text-xs uppercase tracking-wider mb-1">
                New Album
              </div>
              <div className="text-foreground font-display text-3xl leading-tight mb-1">
                {skyAd.title}
              </div>
              <div className="text-foreground/80 font-body text-sm mb-4">
                {skyAd.subtitle}
              </div>
              <div className="flex items-center gap-2 bg-dem text-dem-foreground font-display text-sm px-5 py-2.5 rounded-full">
                <Download className="w-4 h-4" />
                {skyAd.text}
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
                {skyAd.title}
              </div>
              <div className="text-foreground/70 font-body text-sm mb-6">
                {skyAd.subtitle}
              </div>
              <div className="bg-foreground text-background font-display text-sm px-6 py-2 rounded-full">
                {skyAd.text}
              </div>
            </>
          )}
        </a>
      </div>

      {/* Square Ad 260x260 */}
      <div className="relative w-full flex flex-col items-center text-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Advertisement
        </span>
        <a
          href={sqAd.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`h-[260px] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${sqAd.image ? "p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${sqAd.bg} shadow-lg p-4 border-2 border-dashed border-muted-foreground/20`}`}
        >
          {sqAd.image ? (
            <img
              src={sqAd.image}
              alt={sqAd.title}
              className={`w-full h-full block object-cover ${sqAd.scaleClass ?? 'scale-100'}`}
            />
          ) : (
            <>
              <div className="text-foreground/90 font-display text-4xl leading-tight mb-2">
                {sqAd.title}
              </div>
              <div className="text-foreground/70 font-body text-sm mb-6">
                {sqAd.subtitle}
              </div>
              <div className="bg-foreground text-background font-display text-sm px-6 py-2 rounded-full">
                {sqAd.text}
              </div>
            </>
          )}
        </a>
      </div>
    </aside>
  );
};

// Mobile/Tablet horizontal banner ad component
export const MobileAdBanner = () => {
  const bannerAd = mockAds.banner[0];

  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link-mobile", bannerAd.affiliateName],
    queryFn: async () => {
      if (!bannerAd.affiliateName) return null;
      
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, click_count")
        .eq("name", bannerAd.affiliateName)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!bannerAd.affiliateName,
  });

  const getTrackedUrl = () => {
    if (affiliateLink?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${affiliateLink.id}`;
    }
    return "#";
  };

  return (
    <div className="xl:hidden my-6">
      <div className="relative">
        <span className="absolute top-[3%] left-0 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Advertisement
        </span>
        <a
          href={getTrackedUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full h-20 md:h-24 bg-gradient-to-r ${bannerAd.bg} rounded-lg flex items-center justify-between px-4 md:px-6 cursor-pointer hover:scale-[1.01] transition-transform shadow-lg border-2 border-dashed border-muted-foreground/20`}
        >
          <div className="flex items-center gap-3 md:gap-4">
            {bannerAd.isAlbum && (
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shadow-xl border-2 border-white/20 flex-shrink-0">
                <img 
                  src={bannerAd.albumArt} 
                  alt={bannerAd.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="text-foreground/60 font-body text-[10px] uppercase tracking-wider">
                New Album
              </div>
              <div className="text-foreground font-display text-xl md:text-2xl leading-tight">
                {bannerAd.title}
              </div>
              <div className="text-foreground/70 font-body text-xs">
                {bannerAd.subtitle}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-foreground text-background font-display text-xs md:text-sm px-4 py-2 rounded-full flex-shrink-0">
            {bannerAd.text}
          </div>
        </a>
      </div>
    </div>
  );
};

export const MobileSkyscraperAd = ({ index = 0 }: { index?: number }) => {
  const skyAd = mockAds.skyscraper[index];

  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link-mobile-sky", skyAd.affiliateName, index],
    queryFn: async () => {
      if (!skyAd.affiliateName) return null;
      
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, click_count")
        .eq("name", skyAd.affiliateName)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!skyAd.affiliateName,
  });

  const getTrackedUrl = () => {
    if (affiliateLink?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${affiliateLink.id}`;
    }
    return skyAd.link;
  };

  return (
    <div className="lg:hidden w-full my-6 flex justify-center">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Advertisement
        </span>
        <a
          href={getTrackedUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${skyAd.image ? "h-auto p-0 overflow-hidden border-0 bg-transparent" : `bg-gradient-to-b ${skyAd.bg} shadow-lg p-4 text-center border-2 border-dashed border-muted-foreground/20`}`}
        >
          {skyAd.image ? (
            <img
              src={skyAd.image}
              alt={skyAd.title}
              className={`w-full h-auto block object-contain`}
            />
          ) : skyAd.isAlbum ? (
            <>
              <div className="w-[130px] h-[130px] rounded-lg overflow-hidden mb-4 shadow-xl border-2 border-white/20">
                <img 
                  src={skyAd.albumArt} 
                  alt={skyAd.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-foreground/60 font-body text-xs uppercase tracking-wider mb-1">
                New Album
              </div>
              <div className="text-foreground font-display text-3xl leading-tight mb-1">
                {skyAd.title}
              </div>
              <div className="text-foreground/80 font-body text-sm mb-4">
                {skyAd.subtitle}
              </div>
              <div className="flex items-center gap-2 bg-dem text-dem-foreground font-display text-sm px-5 py-2.5 rounded-full">
                <Download className="w-4 h-4" />
                {skyAd.text}
              </div>
            </>
          ) : (
            <>
              <div className="text-foreground/90 font-display text-2xl leading-tight mb-2">
                {skyAd.title}
              </div>
              <div className="text-foreground/70 font-body text-sm mb-6">
                {skyAd.subtitle}
              </div>
              <div className="bg-foreground text-background font-display text-sm px-6 py-2 rounded-full">
                {skyAd.text}
              </div>
            </>
          )}
        </a>
      </div>
    </div>
  );
};

export const MobileSquareAd = () => {
  const sqAd = mockAds.square[0];

  return (
    <div className="lg:hidden w-full my-6 flex justify-center">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Advertisement
        </span>
        <a
          href={sqAd.link || "#"}
          target={sqAd.link ? "_blank" : undefined}
          rel={sqAd.link ? "noopener noreferrer" : undefined}
          className={`rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${sqAd.image ? "h-auto p-0 overflow-hidden border-0 bg-transparent" : `aspect-square bg-gradient-to-b ${sqAd.bg} shadow-lg p-4 text-center border-2 border-dashed border-muted-foreground/20`}`}
        >
          {sqAd.image ? (
            <img
              src={sqAd.image}
              alt={sqAd.title}
              className="object-contain w-auto h-auto max-w-full block mx-auto"
            />
          ) : (
            <>
              <div className="text-foreground/90 font-display text-xl leading-tight mb-2">
                {sqAd.title}
              </div>
              <div className="text-foreground/70 font-body text-xs mb-4">
                {sqAd.subtitle}
              </div>
              <div className="bg-foreground text-background font-display text-xs px-4 py-1.5 rounded-full">
                {sqAd.text}
              </div>
            </>
          )}
        </a>
      </div>
    </div>
  );
};
