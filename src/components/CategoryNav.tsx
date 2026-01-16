import { Link, useLocation } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";

export function CategoryNav() {
  const { data: categories, isLoading } = useCategories();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get("category");

  if (isLoading || !categories?.length) return null;

  return (
    <div className="fixed top-[100px] md:top-[116px] left-0 right-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-1 overflow-x-auto py-2 px-4 scrollbar-hide">
          <Link
            to="/"
            className={`px-4 py-2 font-body text-xs uppercase tracking-wider whitespace-nowrap transition-colors rounded ${
              location.pathname === "/" && !location.search
                ? "bg-dem text-dem-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/?category=${category.slug}`}
              className={`px-4 py-2 font-body text-xs uppercase tracking-wider whitespace-nowrap transition-colors rounded ${
                currentCategory === category.slug
                  ? "bg-dem text-dem-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {category.name}
            </Link>
          ))}
          {/* Add spacer for better scrolling on mobile */}
          <div className="w-4 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
