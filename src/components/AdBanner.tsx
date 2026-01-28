import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://duldhllwapsjytdzpjfz.supabase.co";

interface Ad {
  title: string;
  subtitle: string;
  bg: string;
  text: string;
  link?: string;
  isAlbum?: boolean;
  albumArt?: string;
  affiliateName?: string | null;
}

const mockAd: Ad = {
  title: "NEW MUSIC MONDAYS",
  subtitle: "Showcase your band or artist",
  bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
  text: "BOOK NOW",
  link: "/booking",
  isAlbum: false,
  affiliateName: null,
};

interface AdBannerProps {
  className?: string;
  showLabel?: boolean;
}

export const AdBanner = ({ className = "", showLabel = true }: AdBannerProps) => {
  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link", mockAd.affiliateName],
    queryFn: async () => {
      if (!mockAd.affiliateName) return null;
      
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, click_count")
        .eq("name", mockAd.affiliateName)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!mockAd.affiliateName,
  });

  const getTrackedUrl = () => {
    if (affiliateLink?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${affiliateLink.id}`;
    }
    return mockAd.link || "#";
  };

  const isInternal = mockAd.link?.startsWith("/");

  const AdContent = () => (
    <>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-6 md:gap-8 relative z-10">
        {mockAd.isAlbum && (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 flex-shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <img 
              src={mockAd.albumArt} 
              alt={mockAd.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          {mockAd.isAlbum && (
            <div className="text-foreground/60 font-body text-xs uppercase tracking-[0.2em] mb-2">
              New Album
            </div>
          )}
          <div className="text-foreground font-display text-2xl md:text-4xl leading-tight mb-2">
            {mockAd.title}
          </div>
          <div className="text-foreground/70 font-body text-base md:text-lg">
            {mockAd.subtitle}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-foreground text-background font-display text-sm md:text-base px-8 py-4 rounded-full flex-shrink-0 shadow-lg group-hover:bg-dem group-hover:text-dem-foreground transition-colors relative z-10">
        {mockAd.text}
      </div>
    </>
  );

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <span className="absolute -top-5 left-0 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-body">
          Advertisement
        </span>
      )}
      {isInternal ? (
        <Link
          to={mockAd.link || "#"}
          title={mockAd.title}
          className={`w-full h-32 md:h-40 bg-gradient-to-r ${mockAd.bg} rounded-2xl flex items-center justify-between px-6 md:px-10 cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-2xl hover:shadow-dem/20 border-2 border-muted-foreground/30 relative overflow-hidden group`}
        >
          <AdContent />
        </Link>
      ) : (
        <a
          href={getTrackedUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title={mockAd.title}
          className={`w-full h-32 md:h-40 bg-gradient-to-r ${mockAd.bg} rounded-2xl flex items-center justify-between px-6 md:px-10 cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-2xl hover:shadow-dem/20 border-2 border-muted-foreground/30 relative overflow-hidden group`}
        >
          <AdContent />
        </a>
      )}
    </div>
  );
};
