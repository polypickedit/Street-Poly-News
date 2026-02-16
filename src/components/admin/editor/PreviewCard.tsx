import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PreviewCardProps {
  title: string;
  subtitle?: string;
  thumbnail?: string;
  status?: "live" | "draft" | "selected" | "empty";
  className?: string;
  children?: React.ReactNode;
}

export function PreviewCard({ 
  title, 
  subtitle, 
  thumbnail, 
  status = "draft", 
  className,
  children 
}: PreviewCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
      status === "selected" && "ring-2 ring-primary border-primary bg-primary/5",
      status === "live" && "border-l-4 border-l-green-500",
      className
    )}>
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-24 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0 border border-border/50 relative">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={title} 
              className="w-full h-full object-cover transition-transform hover:scale-105" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground text-xs">
              No Image
            </div>
          )}
          
          {status === "live" && (
            <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
              Live
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="text-sm font-semibold leading-tight truncate">{title}</h4>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
