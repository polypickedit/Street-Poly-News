import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function BreakingNewsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: breakingPosts } = useQuery({
    queryKey: ["breaking-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_breaking", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!breakingPosts?.length) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingPosts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [breakingPosts?.length]);

  if (!breakingPosts?.length) return null;

  const currentPost = breakingPosts[currentIndex];

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <Link
          to={`/post/${currentPost.id}`}
          className="flex items-center gap-3 py-2 hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span className="font-display text-sm tracking-wider">BREAKING</span>
          </div>
          <span className="font-body text-sm truncate">
            {currentPost.title}
          </span>
          {breakingPosts.length > 1 && (
            <span className="ml-auto text-xs opacity-70 shrink-0">
              {currentIndex + 1}/{breakingPosts.length}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
