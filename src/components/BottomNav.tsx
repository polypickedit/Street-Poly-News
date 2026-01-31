import { Home, Grid3X3, Search, Menu, Settings } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

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
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: categories } = useCategories();

  useEffect(() => {
    // TEMPORARY BYPASS: Force admin to true
    setIsAdmin(true);
    return;
    
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          // @ts-expect-error - RPC is not in the generated types
          const { data: hasAccess, error } = await supabase.rpc("is_admin_or_editor");
          
          if (error) throw error;
          setIsAdmin(!!hasAccess);
        } catch (err) {
          console.error("Error checking admin status:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Only use scroll logic on mobile
      if (window.innerWidth >= 768) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if user is near the bottom (within 150px to ensure we don't cover buttons)
      const nearBottom = currentScrollY + windowHeight >= documentHeight - 150;
      setIsNearBottom(nearBottom);

      const scrollThreshold = 50;

      // Hide at the top of the page
      if (currentScrollY < scrollThreshold) {
        setIsVisible(false);
        setLastScrollY(currentScrollY);
        return;
      }

      // Hide at the bottom to avoid covering the tip button
      if (nearBottom) {
        setIsVisible(false);
        return;
      }

      // Show when scrolling down, hide when scrolling up
      if (currentScrollY > lastScrollY + 5) {
        setIsVisible(true); // Pop up on scroll down
      } else if (currentScrollY < lastScrollY - 5) {
        setIsVisible(false); // Hide on scroll up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // If mouse is within 100px of the bottom of the viewport
      if (window.innerHeight - e.clientY < 100) {
        setIsVisible(true);
      } else if (window.innerWidth >= 768 && !menuOpen) {
        // On desktop (>= md), hide it if mouse is not at the bottom
        // and menu (sheet) is not open
        setIsVisible(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [menuOpen]);

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
          className="fixed bottom-8 left-0 right-0 z-50 bg-dem-dark/95 backdrop-blur-sm border-t border-blue-900/50 text-white safe-area-bottom"
        >
          <div className="flex items-center justify-between h-20 max-w-2xl mx-auto px-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors min-w-[80px]",
                  isActive(item.path)
                    ? "text-blue-50"
                    : "text-blue-200/70 hover:text-rep"
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive(item.path) && "animate-bounce-subtle")} />
                <span className="text-xs font-semibold uppercase tracking-wider font-display">
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

            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors min-w-[80px]",
                  location.pathname.startsWith("/admin")
                    ? "text-rep"
                    : "text-blue-200/70 hover:text-rep"
                )}
              >
                <Settings className={cn("h-6 w-6", location.pathname.startsWith("/admin") && "animate-spin-slow")} />
                <span className="text-xs font-semibold uppercase tracking-wider font-display">
                  Admin
                </span>
              </Link>
            )}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors min-w-[80px]",
                    menuOpen ? "text-blue-50" : "text-blue-200/70 hover:text-rep"
                  )}
                >
                  <Menu className="h-6 w-6" />
                  <span className="text-xs font-semibold uppercase tracking-wider font-display">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" aria-describedby={undefined} className="w-[300px] !bg-dem-dark border-r border-white/10 p-6 overflow-y-auto">
                <SheetHeader className="mb-8">
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
                      {categories?.map((category, index) => {
                        const isExclusive = category.slug === "exclusive";
                        const displayName = isExclusive ? "Exclusives" : category.name;
                        // If it's the first item and we have an odd number of total items (including hardcoded), 
                        // or if the name is specifically long, make it span 2 columns
                        const shouldSpan = index === 0 && (categories.length % 2 !== 0);
                        
                        return (
                          <Link
                            key={category.id}
                            to={`/category/${category.slug}`}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors",
                              shouldSpan && "col-span-2"
                            )}
                          >
                            <div className={`w-3 h-3 rounded-full cat-dot-${category.id}`} />
                            <span className="text-lg font-medium text-white truncate">
                              {displayName}
                            </span>
                          </Link>
                        );
                      })}
                      {!categories?.some(c => c.slug === 'fashion') && (
                        <Link
                          to="/?category=fashion"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                        >
                          <div className="w-3 h-3 rounded-full bg-pink-500" />
                          <span className="text-lg font-medium">Fashion</span>
                        </Link>
                      )}
                      {!categories?.some(c => c.slug === 'health') && (
                        <Link
                          to="/?category=health"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                        >
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-lg font-medium">Health</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-3">
                      Pages
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/"
                        onClick={() => setMenuOpen(false)}
                        className="col-span-2 flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                      >
                        <span className="text-lg font-medium">Home</span>
                      </Link>
                      <Link
                        to="/#videos"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                      >
                        <span className="text-lg font-medium">Videos</span>
                      </Link>
                      <Link
                        to="/gallery"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                      >
                        <span className="text-lg font-medium">Gallery</span>
                      </Link>
                      <Link
                        to="/merch"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                      >
                        <span className="text-lg font-medium">Merch</span>
                      </Link>
                      <Link
                        to="/booking"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                      >
                        <span className="text-lg font-medium">Booking</span>
                      </Link>
                      <Link
                        to="/about"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                      >
                        <span className="text-lg font-medium">About</span>
                      </Link>
                      <Link
                        to="/contact"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                      >
                        <span className="text-lg font-medium">Contact</span>
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
