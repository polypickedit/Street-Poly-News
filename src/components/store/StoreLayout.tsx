import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StoreLayoutProps {
  children: ReactNode;
  narrative?: ReactNode;
  className?: string;
}

const CATEGORIES = [
  { name: "Join", path: "/community", description: "Membership & Community" },
  { name: "Book", path: "/booking", description: "Studio & Events" },
  { name: "Learn", path: "/about", description: "Education & Resources" },
  { name: "Shop", path: "/merch", description: "Apparel & Goods" },
] as const;

export function StoreLayout({ children, narrative, className }: StoreLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Narrative Section - Top of funnel */}
      {narrative && (
        <section className="w-full bg-muted/50 py-8 md:py-12 border-b animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="container max-w-5xl mx-auto text-center">
            {narrative}
          </div>
        </section>
      )}

      {/* Category Navigation - Sticky */}
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-center">
          <div className="flex gap-1 md:gap-4 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {CATEGORIES.map((category) => {
              const isActive = location.pathname.startsWith(category.path);
              return (
                <Link
                  key={category.name}
                  to={category.path}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                    isActive 
                      ? "text-primary font-bold" 
                      : "text-muted-foreground"
                  )}
                >
                  {category.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={cn("flex-1 container py-6 md:py-10", className)}>
        {children}
      </main>
    </div>
  );
}
