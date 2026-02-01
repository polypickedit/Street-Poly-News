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
              <Link
                to="/?category=politics"
                className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted"
                style={{ "--bg-color": "#3b82f6" } as React.CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                <div className="w-4 h-4 rounded-full mb-3 bg-blue-500" />
                <h2 className="text-lg font-semibold">Politics</h2>
              </Link>
              <Link
                to="/?category=entertainment"
                className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted"
                style={{ "--bg-color": "#8b5cf6" } as React.CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                <div className="w-4 h-4 rounded-full mb-3 bg-purple-500" />
                <h2 className="text-lg font-semibold">Entertainment</h2>
              </Link>
              <Link
                to="/?category=business"
                className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted"
                style={{ "--bg-color": "#f59e0b" } as React.CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                <div className="w-4 h-4 rounded-full mb-3 bg-amber-500" />
                <h2 className="text-lg font-semibold">Business</h2>
              </Link>
              <Link
                to="/?category=exclusive"
                className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted"
                style={{ "--bg-color": "#ef4444" } as React.CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                <div className="w-4 h-4 rounded-full mb-3 bg-red-500" />
                <h2 className="text-lg font-semibold">Exclusives</h2>
              </Link>
              <Link
                to="/?category=fashion"
                className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted"
                style={{ "--bg-color": "#ec4899" } as React.CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                <div className="w-4 h-4 rounded-full mb-3 bg-pink-500" />
                <h2 className="text-lg font-semibold">Fashion</h2>
              </Link>
              <Link
                to="/?category=health"
                className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-lg bg-muted dynamic-bg-muted"
                style={{ "--bg-color": "#10b981" } as React.CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-primary dynamic-bg" />
                <div className="w-4 h-4 rounded-full mb-3 bg-emerald-500" />
                <h2 className="text-lg font-semibold">Health</h2>
              </Link>
            </div>
          )}
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Categories;
