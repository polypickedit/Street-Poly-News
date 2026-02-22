import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from '@supabase/supabase-js';
import { Promo } from "@/types/promo";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";

export const SkyscraperRenderer = ({ promo }: { promo: Promo }) => {
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

export const SquareRenderer = ({ promo }: { promo: Promo }) => {
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
