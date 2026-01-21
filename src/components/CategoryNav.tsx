import { Link, useLocation } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

export function CategoryNav() {
  const { data: categories, isLoading } = useCategories();
  const isVisible = useHeaderVisible();
  const isMobile = useIsMobile();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get("category");

  if (isLoading || !categories?.length) return null;

  return (
    <motion.div
      initial={false}
      animate={{ 
        top: isVisible ? (isMobile ? 100 : 116) : 36 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 right-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm"
    >
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
          <Link
            to="/?category=health"
            className={`px-4 py-2 font-body text-xs uppercase tracking-wider whitespace-nowrap transition-colors rounded ${
              currentCategory === "health"
                ? "bg-dem text-dem-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Health
          </Link>
          <Link
            to="/?category=fashion"
            className={`px-4 py-2 font-body text-xs uppercase tracking-wider whitespace-nowrap transition-colors rounded ${
              currentCategory === "fashion"
                ? "bg-dem text-dem-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Fashion
          </Link>
          <Link
            to="/merch"
            className={`px-6 py-2 font-display text-sm uppercase tracking-widest whitespace-nowrap transition-all rounded-md ml-2 border-2 ${
              location.pathname === "/merch"
                ? "bg-rep text-rep-foreground border-rep shadow-md scale-105"
                : "border-rep text-rep hover:bg-rep hover:text-rep-foreground"
            }`}
          >
            Official Store
          </Link>
          {/* Add spacer for better scrolling on mobile */}
          <div className="w-4 flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
