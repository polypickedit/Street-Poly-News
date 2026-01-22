import { useSearchParams, Link } from "react-router-dom";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { useSearch } from "@/hooks/useSearch";
import { PostCard } from "@/components/PostCard";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const { data: results, isLoading } = useSearch(query);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <PageLayoutWithAds>
      <main className="w-full pb-20">
        <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8 text-center">
          Search <span className="text-primary">Results</span>
        </h1>

        <div className="flex justify-center w-full mb-12">
          <form onSubmit={handleSubmit} className="w-full max-w-xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stories, people, topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 pr-12 py-8 text-xl bg-card border-border text-center placeholder:text-center rounded-2xl shadow-lg focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : query.length < 3 ? (
          <p className="text-muted-foreground font-body">
            Enter at least 3 characters to search
          </p>
        ) : results?.length ? (
          <>
            <p className="text-muted-foreground font-body mb-6">
              Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  subtitle={post.subtitle}
                  youtube_id={post.youtube_id}
                  thumbnail_url={post.thumbnail_url}
                  created_at={post.created_at}
                  content_type={post.content_type}
                  is_breaking={post.is_breaking}
                  is_featured={post.is_featured}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-body text-lg mb-4">
              No results found for "{query}"
            </p>
            <Link to="/" className="text-primary hover:underline font-body">
              Back to Home
            </Link>
          </div>
        )}
      </main>
    </PageLayoutWithAds>
  );
};

export default Search;
