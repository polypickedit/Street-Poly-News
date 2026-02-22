import { Download, Music, Edit } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from '@supabase/supabase-js';
import newMusicMondaysSideBanner from "@/assets/New Music Monday Side banner ad.png";
import stripClubSlotsAd from "@/assets/Strip_Club_Slots_ad-removebg-preview.png";
import streetPolyMerchAd from "@/assets/StreetPolyMerch_Ad.jpeg";
import { Slot } from "./Slot";
import { useAuth } from "@/hooks/useAuth";
import { MediaLibraryDialog } from "@/components/admin/MediaLibraryDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Promo } from "@/types/promo";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";

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
      scaleClass: "scale-100",
    },
  ],
};

interface PromoSidebarProps {
  position: "left" | "right";
}

export const PromoSidebar = ({ position }: PromoSidebarProps) => {
  const { session } = useAuth();
  const isAdmin = !!session; // Assuming any logged-in user is admin for now
  const queryClient = useQueryClient();
  const skyPromoFallback = mockPromos.skyscraper[position === "left" ? 0 : 1];
  const sqPromoFallback = mockPromos.square[position === "left" ? 0 : 2];

  const handleUpdate = async (slotKey: string, url: string, currentId?: string | null) => {
    try {
      // Create metadata for the ad
      const metadata = {
        imageUrl: url,
        title: "Custom Ad",
        description: "Uploaded via admin interface",
        targetUrl: "#", // Default to hash, can be edited later if we add fields
      };

      if (currentId) {
        // Update existing placement
        const { error } = await supabase
          .from("content_placements")
          .update({ metadata })
          .eq("id", currentId);
          
        if (error) throw error;
      } else {
        // Create new placement
        const { error } = await supabase
          .from("content_placements")
          .insert({
            slot_key: slotKey,
            content_type: "ad",
            metadata,
            active: true,
            priority: 100, // High priority to override others
            device_scope: "all",
          });
          
        if (error) throw error;
      }

      toast.success("Ad updated successfully");
      queryClient.invalidateQueries({ queryKey: ["slot-content", slotKey] });
    } catch (error) {
      console.error("Error updating ad:", error);
      toast.error("Failed to update ad");
    }
  };

  return (
    <aside 
      className="hidden lg:flex flex-col items-center gap-6 sticky top-32 h-fit max-h-[calc(100vh-9rem)] w-[260px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    >
      {/* Skyscraper Promo 260x600 */}
      <Slot
        slotKey={`sidebar.${position}.sky`}
        accepts={["ad"]}
        fallback={
          <div className="relative group w-full">
             <SkyscraperRenderer promo={skyPromoFallback} />
             {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <MediaLibraryDialog 
                    trigger={<Button size="icon" variant="secondary" className="h-8 w-8 shadow-md"><Edit className="w-4 h-4" /></Button>}
                    onSelect={(url) => handleUpdate(`sidebar.${position}.sky`, url)}
                  />
                </div>
              )}
          </div>
        }
        className="w-full"
      >
        {(content) => {
          const promo: Promo = content?.metadata?.imageUrl ? {
            title: content.metadata.title as string || "Ad",
            subtitle: content.metadata.description as string || "",
            bg: "from-zinc-100 to-zinc-200",
            text: "LEARN MORE",
            link: content.metadata.targetUrl as string || "#",
            image: content.metadata.imageUrl as string,
            scaleClass: "scale-100",
            objectPosition: "center",
          } : skyPromoFallback;

          return (
            <div className="relative group w-full">
              <SkyscraperRenderer promo={promo} />
              {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <MediaLibraryDialog 
                    trigger={<Button size="icon" variant="secondary" className="h-8 w-8 shadow-md"><Edit className="w-4 h-4" /></Button>}
                    onSelect={(url) => handleUpdate(`sidebar.${position}.sky`, url, content?.placementId)}
                  />
                </div>
              )}
            </div>
          );
        }}
      </Slot>

      {/* Square Promo 260x260 */}
      <Slot
        slotKey={`sidebar.${position}.sq`}
        accepts={["ad"]}
        fallback={
          <div className="relative group w-full">
            <SquareRenderer promo={sqPromoFallback} />
            {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <MediaLibraryDialog 
                    trigger={<Button size="icon" variant="secondary" className="h-8 w-8 shadow-md"><Edit className="w-4 h-4" /></Button>}
                    onSelect={(url) => handleUpdate(`sidebar.${position}.sq`, url)}
                  />
                </div>
              )}
          </div>
        }
        className="w-full"
      >
        {(content) => {
          const promo: Promo = content?.metadata?.imageUrl ? {
            title: content.metadata.title as string || "Ad",
            subtitle: content.metadata.description as string || "",
            bg: "from-zinc-100 to-zinc-200",
            text: "LEARN MORE",
            link: content.metadata.targetUrl as string || "#",
            image: content.metadata.imageUrl as string,
            scaleClass: "scale-100",
          } : sqPromoFallback;

          return (
             <div className="relative group w-full">
              <SquareRenderer promo={promo} />
              {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <MediaLibraryDialog 
                    trigger={<Button size="icon" variant="secondary" className="h-8 w-8 shadow-md"><Edit className="w-4 h-4" /></Button>}
                    onSelect={(url) => handleUpdate(`sidebar.${position}.sq`, url, content?.placementId)}
                  />
                </div>
              )}
            </div>
          );
        }}
      </Slot>
    </aside>
  );
};

// Helper component for Skyscraper
const SkyscraperRenderer = ({ promo }: { promo: Promo }) => {
  const { data: affiliateLink } = useQuery({
    queryKey: ["affiliate-link", promo.affiliateName],
    queryFn: async ({ signal }) => {
      if (!promo.affiliateName) return null;
      try {
        const { data, error } = await (supabase as SupabaseClient)
          .from("affiliate_links")
          .select("id, click_count")
          .eq("name", promo.affiliateName)
          .abortSignal(signal)
          .maybeSingle();

        if (error) return null;
        return data;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return null;
        }
        return null;
      }
    },
    enabled: !!promo.affiliateName,
  });

  const getTrackedUrl = () => {
    const linkData = affiliateLink;
    if (linkData?.id) {
      return `${SUPABASE_URL}/functions/v1/track-click?id=${linkData.id}`;
    }
    return promo.link;
  };

  const isInternal = promo.link?.startsWith("/");

  const Content = () => (
    <>
      {promo.image ? (
        <img
          src={promo.image}
          alt={promo.title}
          className={`w-full h-full block object-cover object-${promo.objectPosition ?? 'center'} origin-${promo.objectPosition === 'top' ? 'top' : 'center'} ${promo.scaleClass ?? 'scale-100'}`}
        />
      ) : promo.isAlbum ? (
        <div className="flex flex-col items-center p-4 text-center">
          <div className="w-[130px] h-[130px] rounded-lg overflow-hidden mb-4 shadow-xl border-2 border-border">
            <img src={promo.albumArt} alt={promo.title} className="w-full h-full object-cover" />
          </div>
          <div className="text-muted-foreground font-black uppercase tracking-widest text-[10px] mb-1">New Album</div>
          <div className="text-dem font-display text-3xl font-black leading-tight uppercase mb-1">{promo.title}</div>
          <div className="text-muted-foreground font-medium text-sm mb-4">{promo.subtitle}</div>
          <div className="flex items-center gap-2 bg-dem text-white font-display font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded-full hover:bg-dem/90 transition-colors">
            <Download className="w-4 h-4" /> {promo.text}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center p-4 text-center">
          <div className="text-dem font-display text-2xl font-black uppercase leading-tight mb-2">{promo.title}</div>
          <div className="text-muted-foreground font-medium text-sm mb-6">{promo.subtitle}</div>
          <div className="bg-dem text-white font-display font-black uppercase tracking-widest text-xs px-6 py-2 rounded-full hover:bg-dem/90 transition-colors">{promo.text}</div>
        </div>
      )}
    </>
  );

  return (
    <div className="relative w-full flex flex-col items-center">
      <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">Promotion</span>
      {isInternal ? (
        <Link to={promo.link || "#"} className={`h-[600px] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${promo.image ? "p-0 overflow-hidden border-0 bg-transparent" : "bg-card shadow-lg p-4 text-center border-2 border-border"}`}>
          <Content />
        </Link>
      ) : (
        <a 
          href={getTrackedUrl()} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label={`Advertisement: ${promo.title}`}
          className={`h-[600px] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${promo.image ? "p-0 overflow-hidden border-0 bg-transparent" : "bg-card shadow-lg p-4 text-center border-2 border-border"}`}
        >
          <Content />
        </a>
      )}
    </div>
  );
};

const SquareRenderer = ({ promo }: { promo: Promo }) => {
  const isInternal = promo.link?.startsWith("/");

  const Content = () => (
    <>
      {promo.image ? (
        <img src={promo.image} alt={promo.title} className={`w-full h-auto block object-contain ${promo.scaleClass ?? 'scale-100'}`} />
      ) : (
        <div className="flex flex-col items-center p-4 text-center">
          <div className="text-dem font-display text-4xl font-black uppercase leading-tight mb-2">{promo.title}</div>
          <div className="text-muted-foreground font-medium text-sm mb-6">{promo.subtitle}</div>
          <div className="bg-dem text-white font-display font-black uppercase tracking-widest text-xs px-6 py-2 rounded-full hover:bg-dem/90 transition-colors">{promo.text}</div>
        </div>
      )}
    </>
  );

  return (
    <div className="relative w-full flex flex-col items-center text-center">
      <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">Promotion</span>
      {isInternal ? (
        <Link to={promo.link || "#"} className={`h-auto rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${promo.image ? "p-0 overflow-hidden border-0 bg-transparent" : "bg-card shadow-lg p-4 border-2 border-border"}`}>
          <Content />
        </Link>
      ) : (
        <a 
          href={promo.link || "#"} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label={`Advertisement: ${promo.title}`}
          className={`h-auto rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform w-full ${promo.image ? "p-0 overflow-hidden border-0 bg-transparent" : "bg-card shadow-lg p-4 border-2 border-border"}`}
        >
          <Content />
        </a>
      )}
    </div>
  );
};

export const MobilePromoBanner = () => {
  const bannerPromo = mockPromos.banner[0];
  const isInternal = bannerPromo.link?.startsWith("/");
  return (
    <div className="xl:hidden my-6">
      <div className="relative">
        <span className="absolute top-[3%] left-0 text-[10px] text-muted-foreground font-black uppercase tracking-widest">Promotion</span>
        {isInternal ? (
          <Link to={bannerPromo.link || "#"} className={`w-full h-20 md:h-24 bg-card rounded-lg flex items-center justify-between px-4 md:px-6 cursor-pointer hover:scale-[1.01] transition-transform shadow-lg border-2 border-border`}>
             <div className="text-dem font-display text-xl md:text-2xl font-black uppercase leading-tight">{bannerPromo.title}</div>
             <div className="bg-dem text-white font-display font-black uppercase tracking-widest text-xs px-4 py-2 rounded-full">{bannerPromo.text}</div>
          </Link>
        ) : (
          <a href={bannerPromo.link || "#"} target="_blank" rel="noopener noreferrer" className={`w-full h-20 md:h-24 bg-card rounded-lg flex items-center justify-between px-4 md:px-6 cursor-pointer hover:scale-[1.01] transition-transform shadow-lg border-2 border-border`}>
             <div className="text-dem font-display text-xl md:text-2xl font-black uppercase leading-tight">{bannerPromo.title}</div>
             <div className="bg-dem text-white font-display font-black uppercase tracking-widest text-xs px-4 py-2 rounded-full">{bannerPromo.text}</div>
          </a>
        )}
      </div>
    </div>
  );
};

export const MobileSkyscraperPromo = ({ index = 0 }: { index?: number }) => {
  const skyPromo = mockPromos.skyscraper[index];
  return (
    <div className="lg:hidden w-full my-6 flex justify-center">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">Promotion</span>
        <div className={`rounded-lg flex flex-col items-center justify-center w-full ${skyPromo.image ? "h-auto border-0 bg-transparent" : "bg-card shadow-lg p-4 text-center border-2 border-border"}`}>
          {skyPromo.image ? <img src={skyPromo.image} alt={skyPromo.title} className="w-full h-auto object-contain" /> : <div className="text-dem font-black uppercase">{skyPromo.title}</div>}
        </div>
      </div>
    </div>
  );
};

export const MobileSquarePromo = () => {
  const sqPromo = mockPromos.square[0];
  return (
    <div className="lg:hidden w-full my-6 flex justify-center">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">Promotion</span>
        <div className={`rounded-lg flex flex-col items-center justify-center w-full ${sqPromo.image ? "h-auto border-0 bg-transparent" : "aspect-square bg-card shadow-lg p-4 text-center border-2 border-border"}`}>
          {sqPromo.image ? <img src={sqPromo.image} alt={sqPromo.title} className="w-full h-auto block" /> : <div className="text-dem font-black uppercase">{sqPromo.title}</div>}
        </div>
      </div>
    </div>
  );
};
