import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useSlotContents } from "@/hooks/usePlacements";
import { SupabaseClient } from "@supabase/supabase-js";

export function BreakingNewsBanner() {
  const { data: placements, isLoading: loadingPlacements } = useSlotContents("home.breaking");

  const { data: breakingPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ["breaking-posts", placements?.map(p => p.content_id)],
    queryFn: async ({ signal }) => {
      try {
        // If we have specific placements, fetch them
        if (placements && placements.length > 0) {
          const ids = placements.map(p => parseInt(p.content_id!)).filter(id => !isNaN(id));
          if (ids.length > 0) {
            const query = (supabase as SupabaseClient)
               .from("posts")
               .select("*")
               .in("id", ids) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: { id: string; title: string }[] | null; error: { code: string; message: string } | null }> };
 
             const { data, error } = await query.abortSignal(signal);
             if (error) throw error;
             return data || [];
           }
         }
 
         // Fallback: Latest breaking posts
         const fallbackQuery = (supabase as SupabaseClient)
           .from("posts")
           .select("*")
           .eq("is_breaking", true)
           .order("created_at", { ascending: false })
           .limit(10) as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: { id: string; title: string }[] | null; error: { code: string; message: string } | null }> };
 
         const { data, error } = await fallbackQuery.abortSignal(signal);
 
         if (error) throw error;
         return data || [];
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return [];
        }
        throw err;
      }
    },
    enabled: !loadingPlacements,
  });

  const hasPosts = breakingPosts && breakingPosts.length > 0;
  
  const displayPosts = hasPosts 
    ? (breakingPosts!.length < 5 
        ? [...breakingPosts!, ...breakingPosts!, ...breakingPosts!, ...breakingPosts!]
        : [...breakingPosts!, ...breakingPosts!])
    : [
        { id: "mock-1", title: "🚨 BREAKING: New record-breaking heatwave across the coast" },
        { id: "mock-2", title: "📈 MARKET UPDATE: Tech stocks see unexpected surge in morning trading" },
        { id: "mock-3", title: "⚽ SPORTS: Local team secures spot in championship finals" },
        { id: "mock-4", title: "🎭 ENTERTAINMENT: Surprise performance announced for tonight's festival" },
        { id: "mock-5", title: "🗳️ POLITICS: New bill proposed to address urban infrastructure" }
      ];

  return (
    <div 
      data-slot="home.breaking" 
      data-accepts="video,article"
      className="fixed top-0 left-0 right-0 z-[60] bg-rep text-white overflow-hidden border-b border-white/10"
    >
      <div className="flex items-center h-10 relative">
        <div className="flex items-center gap-2 shrink-0 px-4 pl-4 md:pl-8 bg-rep z-20 relative h-full pr-6 shadow-[4px_0_24px_rgba(0,0,0,0.1)] after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-rep after:to-transparent">
          <AlertTriangle className="w-4 h-4 animate-pulse fill-current" />
          <span className="font-display text-sm tracking-wider font-bold">BREAKING NEWS</span>
        </div>

        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap flex items-center hover:[animation-play-state:paused] py-2 [animation-duration:15s]">
            {displayPosts.map((post, idx) => (
              <Link
                key={`${post.id}-${idx}`}
                to={`/post/${post.id}`}
                className="inline-flex items-center gap-3 mx-4 hover:opacity-80 transition-opacity group"
              >
                <span className="font-body text-sm font-medium">
                  {post.title}
                </span>
                <span className="text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">•</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
