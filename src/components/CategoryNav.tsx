import { Link, useLocation } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";

export function CategoryNav() {
  const { data: categories, isLoading } = useCategories();
  const location = useLocation();

  if (isLoading || !categories?.length) return null;

  return (
    <div className="fixed top-[100px] left-0 right-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          <Link
            to="/"
            className={`px-4 py-2 font-body text-xs uppercase tracking-wider whitespace-nowrap transition-colors rounded ${
              location.pathname === "/" && !location.search
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className={`px-4 py-2 font-body text-xs uppercase tracking-wider whitespace-nowrap transition-colors rounded ${
                location.pathname === `/category/${category.slug}`
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
