import { Link } from "react-router-dom";
import { Play, Video, FileText, Images, Clock, Eye, TrendingUp } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface PostCardProps {
  id: number;
  title: string;
  subtitle: string | null;
  youtube_id: string;
  thumbnail_url: string | null;
  created_at: string;
  content_type?: "video" | "article" | "gallery" | null;
  is_breaking?: boolean;
  is_featured?: boolean;
  view_count?: number | null;
  variant?: "default" | "compact" | "featured";
}

export function PostCard({
  id,
  title,
  subtitle,
  youtube_id,
  thumbnail_url,
  created_at,
  content_type = "video",
  is_breaking = false,
  is_featured = false,
  view_count = 0,
  variant = "default",
}: PostCardProps) {
  const thumbnail =
    thumbnail_url || `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`;

  const getContentIcon = () => {
    switch (content_type) {
      case "article":
        return <FileText className="w-3 h-3" />;
      case "gallery":
        return <Images className="w-3 h-3" />;
      default:
        return <Video className="w-3 h-3" />;
    }
  };

  const getContentLabel = () => {
    switch (content_type) {
      case "article":
        return "Article";
      case "gallery":
        return "Gallery";
      default:
        return "Video";
    }
  };

  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });
  const isNew = new Date(created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (variant === "compact") {
    return (
      <Link
        to={`/post/${id}`}
        className="group flex gap-4 bg-card/50 rounded-lg p-3 hover:bg-card transition-all duration-300 border border-transparent hover:border-dem/30"
      >
        <div className="relative w-28 h-20 flex-shrink-0 rounded-md overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          <div className="absolute bottom-1 right-1 bg-background/80 text-foreground text-[10px] px-1.5 py-0.5 rounded font-body flex items-center gap-1">
            {getContentIcon()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-base text-foreground leading-tight line-clamp-2 group-hover:text-dem transition-colors">
            {title}
          </h4>
          <p className="text-muted-foreground text-xs font-body mt-1">{timeAgo}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/post/${id}`}
      className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-dem/50 transition-all duration-300 hover:shadow-xl hover:shadow-dem/10 hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-dem/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-16 h-16 rounded-full bg-dem/90 backdrop-blur-sm flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-dem/50">
            <Play className="w-7 h-7 text-dem-foreground ml-1" fill="currentColor" />
          </div>
        </div>
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {is_breaking && (
            <span className="px-2.5 py-1 bg-rep text-rep-foreground text-[10px] font-body font-bold uppercase tracking-wider rounded-full animate-pulse shadow-lg">
              🔴 Breaking
            </span>
          )}
          {is_featured && (
            <span className="px-2.5 py-1 bg-dem/90 backdrop-blur-sm text-dem-foreground text-[10px] font-body font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Featured
            </span>
          )}
          {isNew && !is_breaking && (
            <span className="px-2.5 py-1 bg-dem text-dem-foreground text-[10px] font-body font-bold uppercase tracking-wider rounded-full shadow-lg">
              New
            </span>
          )}
        </div>

        {/* Content type badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-body font-semibold uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-lg">
            {getContentIcon()}
            {getContentLabel()}
          </span>
        </div>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-body">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            {view_count && view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {view_count >= 1000 ? `${(view_count / 1000).toFixed(1)}K` : view_count}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-xl md:text-2xl text-foreground leading-tight mb-2 group-hover:text-dem transition-colors line-clamp-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-muted-foreground font-body text-sm line-clamp-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
