import { Home, Grid3X3, Search, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCategories } from "@/hooks/useCategories";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Grid3X3, label: "Categories", path: "/categories" },
  { icon: Search, label: "Search", path: "/search" },
];

export const BottomNav = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { data: categories } = useCategories();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 10;

      if (currentScrollY < scrollThreshold) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY + 5) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 5) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/categories") return location.pathname.startsWith("/category");
    return location.pathname.startsWith(path);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom"
        >
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
                    menuOpen
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Menu className="h-5 w-5" />
                  <span className="text-xs font-medium">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {categories?.map((category) => (
                        <Link
                          key={category.id}
                          to={`/category/${category.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || "hsl(var(--primary))" }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Pages
                    </h3>
                    <div className="space-y-1">
                      <Link
                        to="/merch"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium">Merch</span>
                      </Link>
                      <Link
                        to="/about"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium">About</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};
