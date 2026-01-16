import { Video, FileText, Images } from "lucide-react";

interface PostBadgesProps {
  contentType?: "video" | "article" | "gallery" | null;
  isBreaking?: boolean;
  isFeatured?: boolean;
  categories?: { name: string; color: string }[];
}

export function PostBadges({ contentType, isBreaking, isFeatured, categories }: PostBadgesProps) {
  const getContentIcon = () => {
    switch (contentType) {
      case "article":
        return <FileText className="w-3 h-3" />;
      case "gallery":
        return <Images className="w-3 h-3" />;
      default:
        return <Video className="w-3 h-3" />;
    }
  };

  const getContentLabel = () => {
    switch (contentType) {
      case "article":
        return "Article";
      case "gallery":
        return "Gallery";
      default:
        return "Video";
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {isBreaking && (
        <span className="px-2 py-1 bg-rep text-rep-foreground text-xs font-body font-semibold uppercase tracking-wider rounded flex items-center gap-1 animate-pulse">
          Breaking
        </span>
      )}
      {isFeatured && (
        <span className="px-2 py-1 bg-dem text-dem-foreground text-xs font-body font-semibold uppercase tracking-wider rounded">
          Featured
        </span>
      )}
      <span className="px-2 py-1 bg-dem text-dem-foreground text-xs font-body font-semibold uppercase tracking-wider rounded flex items-center gap-1">
        {getContentIcon()}
        {getContentLabel()}
      </span>
      {categories?.slice(0, 2).map((cat) => (
        <span
          key={cat.name}
          className="px-2 py-1 text-xs font-body font-semibold uppercase tracking-wider rounded text-white dynamic-bg"
          style={{ "--bg-color": cat.color } as React.CSSProperties}
        >
          {cat.name}
        </span>
      ))}
    </div>
  );
}
