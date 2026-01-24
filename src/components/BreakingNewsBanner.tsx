import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function BreakingNewsBanner() {
  const { data: breakingPosts } = useQuery({
    queryKey: ["breaking-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_breaking", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (!breakingPosts?.length) return null;

  // Duplicate posts to ensure seamless loop
  // If we have few posts, duplicate more times to fill width
  const displayPosts = breakingPosts.length < 5 
    ? [...breakingPosts, ...breakingPosts, ...breakingPosts, ...breakingPosts]
    : [...breakingPosts, ...breakingPosts];

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-rep text-white overflow-hidden border-b border-blue-900 md:border-white/10">
      <div className="flex items-center h-10 relative">
        {/* Static Badge */}
        <div className="flex items-center gap-2 shrink-0 px-4 pl-4 md:pl-8 bg-rep z-20 relative h-full pr-6 shadow-[4px_0_24px_rgba(0,0,0,0.1)] after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-rep after:to-transparent">
          <AlertTriangle className="w-4 h-4 animate-pulse fill-current" />
          <span className="font-display text-sm tracking-wider font-bold">BREAKING NEWS</span>
        </div>

        {/* Marquee Content */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap flex items-center hover:[animation-play-state:paused] py-2">
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
