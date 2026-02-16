import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ContentItem {
  id: string;
  title: string;
  thumbnail?: string;
  subtitle?: string;
  type?: string;
  date?: string;
}

interface ContentPickerProps {
  items: ContentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  loading?: boolean;
  filterOptions?: { label: string; value: string }[];
  currentFilter?: string;
  onFilterChange?: (value: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export function ContentPicker({
  items,
  selectedId,
  onSelect,
  onCreate,
  loading = false,
  filterOptions,
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  className
}: ContentPickerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header / Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold">Choose Content</h3>
          {onCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreate}
              className="h-8 text-xs font-medium"
            >
              <Plus className="w-3 h-3 mr-1" /> New
            </Button>
          )}
        </div>

        {(filterOptions || onSearchChange) && (
          <div className="flex items-center gap-2">
            {filterOptions && onFilterChange && (
              <div className="flex bg-muted/30 p-1 rounded-md border border-border flex-1">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange(option.value)}
                    className={cn(
                      "flex-1 px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-all",
                      currentFilter === option.value
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            
            {onSearchChange && (
               <div className="relative w-full max-w-[140px]">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                 <Input 
                   placeholder="Search..." 
                   value={searchQuery}
                   onChange={(e) => onSearchChange(e.target.value)}
                   className="h-8 pl-7 text-xs bg-muted/30 border-transparent focus:bg-background focus:border-input transition-all"
                 />
               </div>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="relative min-h-[200px] border rounded-lg bg-background overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <p className="text-sm">No content found</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "group w-full flex items-start gap-3 p-2 rounded-lg border transition-all text-left relative",
                  selectedId === item.id
                    ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                    : "bg-card border-transparent hover:bg-muted/50 hover:border-border"
                )}
              >
                <div className="w-16 h-10 rounded bg-muted overflow-hidden flex-shrink-0 mt-0.5 relative">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/50 flex items-center justify-center text-[9px] text-muted-foreground uppercase">No Img</div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pr-2">
                  <p className={cn(
                    "text-sm font-medium leading-tight line-clamp-2",
                    selectedId === item.id ? "text-primary" : "text-foreground"
                  )}>{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.type && (
                      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1 rounded">
                        {item.type}
                      </span>
                    )}
                    {item.date && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {item.date}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
