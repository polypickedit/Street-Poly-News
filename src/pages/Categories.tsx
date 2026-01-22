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
        <div className="py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">
            All Categories
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-dem" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <style>
                {categories?.map((category) => `
                  .cat-card-${category.id} { --bg-color: ${category.color || 'var(--primary)'}; }
                `).join('\n')}
              </style>
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className={`group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted cat-card-${category.id}`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                  <div className="w-4 h-4 rounded-full mb-3 bg-primary dynamic-bg" />
                  <h2 className="text-lg font-semibold">
                    {category.slug === "exclusive" ? "Exclusives" : category.name}
                  </h2>
                </Link>
              ))}

              {/* Manual Categories */}
              {!categories?.some(c => c.slug === 'fashion') && (
                <Link
                  to="/?category=fashion"
                  className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted"
                  style={{ "--bg-color": "#ec4899" } as React.CSSProperties}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                  <div className="w-4 h-4 rounded-full mb-3 bg-pink-500" />
                  <h2 className="text-lg font-semibold">Fashion</h2>
                </Link>
              )}
              
              {!categories?.some(c => c.slug === 'health') && (
                <Link
                  to="/?category=health"
                  className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted"
                  style={{ "--bg-color": "#22c55e" } as React.CSSProperties}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                  <div className="w-4 h-4 rounded-full mb-3 bg-green-500" />
                  <h2 className="text-lg font-semibold">Health</h2>
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
