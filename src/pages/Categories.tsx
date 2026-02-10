import { Link } from "react-router-dom";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { useCategories } from "@/hooks/useCategories";
import { Loader2 } from "lucide-react";

const Categories = () => {
  const { data: categories, isLoading } = useCategories();

  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="py-6 sm:py-8 text-foreground">
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">
            All Categories
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-dem" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-card border border-border"
                  style={{ "--category-color": category.color || '#000000' } as React.CSSProperties}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-[var(--category-color)]" 
                  />
                  <div 
                    className="w-4 h-4 rounded-full mb-3 bg-[var(--category-color)]" 
                  />
                  <h2 className="text-lg font-black text-dem">{category.name}</h2>
                </Link>
              ))}
              {/* Fallback for hardcoded categories not in DB yet */}
              {!categories?.some(c => c.slug === 'fashion') && (
                <Link
                  to="/?category=fashion"
                  className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-card border border-border"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-dem" />
                  <div className="w-4 h-4 rounded-full mb-3 bg-dem/60" />
                  <h2 className="text-lg font-black text-dem">Fashion</h2>
                </Link>
              )}
              {!categories?.some(c => c.slug === 'health') && (
                <Link
                  to="/?category=health"
                  className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-card border border-border"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-dem" />
                  <div className="w-4 h-4 rounded-full mb-3 bg-dem/30" />
                  <h2 className="text-lg font-black text-dem">Health</h2>
                </Link>
              )}
            </div>
          )}
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Categories;
