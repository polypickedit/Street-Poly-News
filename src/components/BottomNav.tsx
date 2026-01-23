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
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dem-dark/95 backdrop-blur-sm border-t border-white/10 text-white safe-area-bottom"
        >
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive(item.path) && "animate-bounce-subtle")} />
                <span className="text-[10px] font-medium uppercase tracking-widest font-display">
                  {item.label}
                </span>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-white"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
                    menuOpen ? "text-white" : "text-white/70 hover:text-white"
                  )}
                >
                  <Menu className="h-5 w-5" />
                  <span className="text-xs font-medium">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[80vh] rounded-t-2xl overflow-y-auto bg-dem-dark text-white border border-white/10 shadow-xl"
              >
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 pb-20">
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-3">
                      Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <style>
                        {categories?.map((category) => `.cat-dot-${category.id} { background-color: ${category.color || 'var(--primary)'}; }`).join('\n')}
                      </style>
                      {categories?.map((category) => (
                        <Link
                          key={category.id}
                          to={`/category/${category.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                        >
                          <div className={`w-3 h-3 rounded-full cat-dot-${category.id}`} />
                          <span className="text-sm font-medium text-white">
                            {category.slug === "exclusive" ? "Exclusives" : category.name}
                          </span>
                        </Link>
                      ))}
                      {!categories?.some(c => c.slug === 'fashion') && (
                        <Link
                          to="/?category=fashion"
                          onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                      <span className="text-sm font-medium">Fashion</span>
                    </Link>
                      )}
                      {!categories?.some(c => c.slug === 'health') && (
                        <Link
                          to="/?category=health"
                          onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Health</span>
                    </Link>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-3">
                      Pages
                    </h3>
                    <div className="space-y-1">
                      <Link
                        to="/#videos"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-medium text-white">Videos</span>
                      </Link>
                      <Link
                        to="/gallery"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-medium text-white">Gallery</span>
                      </Link>
                      <Link
                        to="/merch"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-medium text-white">Merch</span>
                      </Link>
                      <Link
                        to="/about"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-medium text-white">About</span>
                      </Link>
                      <Link
                        to="/contact"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-medium text-white">Contact</span>
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
