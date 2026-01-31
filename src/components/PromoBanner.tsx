import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import donTripAd from "@/assets/Don Trip ad.jpeg";

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
}

const promos: Record<string, Promo> = {
  donTrip: {
    title: "DON TRIP - TRAUMA BOND",
    subtitle: "Listen now on all platforms",
    bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
    text: "LISTEN NOW",
    link: "https://itunes.apple.com",
    isAlbum: false,
    image: donTripAd,
    affiliateName: null,
  }
};

interface PromoBannerProps {
  className?: string;
  showLabel?: boolean;
  type?: "donTrip";
}

export const PromoBanner = ({ className = "", showLabel = true, type = "donTrip" }: PromoBannerProps) => {
  const currentPromo = promos[type];
  console.log(`[PromoBanner] Rendering ${type} promo`);

  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link", currentPromo.affiliateName],
    queryFn: async () => {
      if (!currentPromo.affiliateName) return null;
      
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, click_count")
        .eq("name", currentPromo.affiliateName)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!currentPromo.affiliateName,
  });

  const getTrackedUrl = () => {
    if (affiliateLink?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${affiliateLink.id}`;
    }
    return currentPromo.link || "#";
  };

  const isInternal = currentPromo.link?.startsWith("/");

  const PromoContent = () => (
    <>
      {currentPromo.image ? (
        <img 
          src={currentPromo.image} 
          alt={currentPromo.title} 
          className="w-full h-auto block rounded-lg"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-6 md:gap-8 relative z-10">
            {currentPromo.isAlbum && (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 flex-shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <img 
                  src={currentPromo.albumArt} 
                  alt={currentPromo.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              {currentPromo.isAlbum && (
                <div className="text-foreground/60 font-body text-xs uppercase tracking-[0.2em] mb-2">
                  New Album
                </div>
              )}
              <div className="text-foreground font-display text-2xl md:text-4xl leading-tight mb-2">
                {currentPromo.title}
              </div>
              <div className="text-foreground/70 font-body text-base md:text-lg">
                {currentPromo.subtitle}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-foreground text-background font-display text-sm md:text-base px-8 py-4 rounded-full flex-shrink-0 shadow-lg group-hover:bg-dem group-hover:text-dem-foreground transition-colors relative z-10">
            {currentPromo.text}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <span className="absolute -top-5 left-0 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Promotion
        </span>
      )}
      {isInternal ? (
        <Link
          to={currentPromo.link || "#"}
          title={currentPromo.title}
          className={`w-full ${currentPromo.image ? "h-auto bg-transparent p-0 border-0 shadow-none" : `h-32 md:h-40 bg-gradient-to-r ${currentPromo.bg} px-6 md:px-10 border-2 border-muted-foreground/30 shadow-2xl`} rounded-2xl flex items-start justify-center cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-dem/20 relative overflow-hidden group`}
        >
          <PromoContent />
        </Link>
      ) : (
        <a
          href={getTrackedUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title={currentPromo.title}
          className={`w-full ${currentPromo.image ? "h-auto bg-transparent p-0 border-0 shadow-none" : `h-32 md:h-40 bg-gradient-to-r ${currentPromo.bg} px-6 md:px-10 border-2 border-muted-foreground/30 shadow-2xl`} rounded-2xl flex items-start justify-center cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-dem/20 relative overflow-hidden group`}
        >
          <PromoContent />
        </a>
      )}
    </div>
  );
};
