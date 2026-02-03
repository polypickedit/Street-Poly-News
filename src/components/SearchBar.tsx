import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/useSearch";
import { Link } from "react-router-dom";

interface SearchBarProps {
  className?: string;
  onClose?: () => void;
}

export function SearchBar({ className, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: results, isLoading } = useSearch(query);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery("");
      onClose?.();
    }
  };

  return (
    <div ref={containerRef} className={`relative flex justify-center ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search stories..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 bg-card border-white/10 text-foreground placeholder:text-muted-foreground focus-visible:ring-dem text-center placeholder:text-center w-full"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown Results */}
      {isOpen && query.length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/10 rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground font-body text-sm">
              Searching...
            </div>
          ) : results?.length ? (
            <>
              {results.slice(0, 5).map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                    onClose?.();
                  }}
                  className="block p-3 hover:bg-dem/5 transition-colors border-b border-white/10 last:border-0 group"
                >
                  <h4 className="font-display text-sm text-foreground line-clamp-1 group-hover:text-dem transition-colors">
                    {post.title}
                  </h4>
                  {post.subtitle && (
                    <p className="text-muted-foreground text-xs font-body line-clamp-1 mt-1">
                      {post.subtitle}
                    </p>
                  )}
                </Link>
              ))}
              {results.length > 5 && (
                <Link
                  to={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                    onClose?.();
                  }}
                  className="block p-3 text-center text-dem font-body text-sm hover:bg-white/5 transition-colors"
                >
                  View all {results.length} results
                </Link>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground font-body text-sm">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
