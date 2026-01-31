import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, Coins, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";
import { useAccount } from "@/hooks/useAccount";
import { SearchBar } from "@/components/SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useCategories } from "@/hooks/useCategories";
import logo from "/logo.svg";
import mobileSeal from "@/assets/mobile-seal.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Videos", path: "/#videos" },
  { name: "Gallery", path: "/gallery" },
  { name: "Merch", path: "/merch" },
  { name: "Booking", path: "/booking" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileLogoErrored, setMobileLogoErrored] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { data: categories } = useCategories();
  const isVisible = useHeaderVisible();
  const location = useLocation();
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  const { activeAccount, isLoading: isLoadingAccount } = useAccount();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        try {
          const { data: hasAccess, error } = await (supabase as any).rpc("is_admin_or_editor");
          
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

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  const currentNavLinks = isAuthenticated ? [{ name: "Dashboard", path: "/dashboard" }] : [];

  // Force header visible when menu is open
  const headerVisible = isOpen || isVisible;

  return (
    <>
      <AnimatePresence>
        {headerVisible && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-10 left-0 right-0 z-50 bg-dem-dark border-b border-blue-900/50 lg:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]"
          >
            <div className="container mx-auto px-4 relative">
              <div className="flex h-24 md:h-32 items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center shrink-0">
                  <Link 
                    to="/" 
                    className="flex items-center gap-3 md:gap-6 group"
                  >
                    <div className="shrink-0 w-[56px] h-[56px] md:w-24 md:h-24 relative shadow-lg md:shadow-none rounded-full overflow-hidden">
                      <img 
                        src={mobileLogoErrored ? logo : mobileSeal}
                        alt="Streetpoly News"
                        width={56}
                        height={56}
                        className="block md:hidden w-full h-full object-contain filter-none"
                        onError={() => setMobileLogoErrored(true)}
                      />
                      <img 
                        src={logo}
                        alt="Streetpoly News"
                        width={96}
                        height={96}
                        className="hidden md:block w-full h-full object-contain"
                      />
                    </div>

                    <span className="font-display text-2xl md:text-5xl tracking-widest text-blue-50 leading-none">
                      STREETPOLY <span className="text-rep ml-1">NEWS</span>
                    </span>

                  </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex flex-1 justify-center">
                  <div className="flex items-center gap-1 xl:gap-2">
                    {currentNavLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        className={`px-4 py-2 text-sm font-medium transition-all duration-300 uppercase tracking-[0.2em] relative group ${
                          location.pathname === link.path
                            ? "text-blue-400"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {link.name}
                        {location.pathname === link.path && (
                          <motion.div
                            layoutId="nav-underline"
                            className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                          />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                  {isAuthenticated && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                      <Coins size={14} className="text-yellow-500" />
                      <span className="text-xs font-bold text-blue-100">
                        {isLoadingAccount ? (
                          <Loader2 size={12} className="animate-spin text-slate-500" />
                        ) : (
                          activeAccount?.balance || 0
                        )}
                      </span>
                    </div>
                  )}

                  {isAuthenticated ? (
                    isAdmin ? (
                      <Link
                        to="/admin"
                        className="text-xs uppercase tracking-[0.3em] text-rep hover:text-rep/80 transition-colors hidden md:inline-flex"
                      >
                        Admin
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        className="text-xs uppercase tracking-[0.3em] text-blue-400 hover:text-blue-300 transition-colors hidden md:inline-flex"
                      >
                        Dashboard
                      </Link>
                    )
                  ) : (
                    <Link
                      to="/login"
                      className="text-xs uppercase tracking-[0.3em] text-blue-200/50 hover:text-blue-100 transition-colors hidden md:inline-flex"
                    >
                      Login
                    </Link>
                  )}

                  {/* Search Toggle (Desktop only shows if search hidden, Mobile always shows) */}
                  {(!showSearch || window.innerWidth < 1024) && (
                    <button
                      type="button"
                      onClick={() => setShowSearch(!showSearch)}
                      aria-label="Search"
                      className="p-2 text-blue-200/70 hover:text-rep transition-colors"
                    >
                      <Search size={24} />
                    </button>
                  )}

                  {/* Shopping Bag */}
                  <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    className="p-2 text-blue-200/70 hover:text-rep transition-colors relative"
                    aria-label="Shopping bag"
                  >
                    <ShoppingBag size={24} />
                    {totalItems > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-rep text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </button>

                  {/* Menu Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-blue-200/70 hover:text-rep transition-colors"
                    aria-label="Toggle menu"
                  >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>

              {/* Search Bar Overlay */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 bg-dem-dark border-b border-blue-900/50 p-4 flex justify-center z-40"
                  >
                    <SearchBar 
                      className="w-full max-w-2xl" 
                      onClose={() => setShowSearch(false)} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-blue-900/50 py-2 md:py-3 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex items-center justify-start md:justify-center gap-x-6 md:gap-x-8 px-4 min-w-max mx-auto">
                  <Link
                    to="/"
                    className="font-display text-lg uppercase tracking-[0.2em] text-blue-200/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    All
                  </Link>
                  {categories?.map((category) => (
                    <Link
                      key={category.id}
                      to={`/?category=${category.slug}`}
                      className="font-display text-lg uppercase tracking-[0.2em] text-blue-200/70 hover:text-rep transition-colors whitespace-nowrap"
                    >
                      {category.slug === "exclusive" ? "Exclusives" : category.name}
                    </Link>
                  ))}
                  {(!categories || categories.length === 0) && (
                    <>
                      <Link
                        to="/?category=politics"
                        className="font-display text-lg uppercase tracking-[0.2em] text-blue-200/70 hover:text-rep transition-colors whitespace-nowrap"
                      >
                        Politics
                      </Link>
                      <Link
                        to="/?category=entertainment"
                        className="font-display text-lg uppercase tracking-[0.2em] text-blue-200/70 hover:text-rep transition-colors whitespace-nowrap"
                      >
                        Entertainment
                      </Link>
                      <Link
                        to="/?category=business"
                        className="font-display text-lg uppercase tracking-[0.2em] text-blue-200/70 hover:text-rep transition-colors whitespace-nowrap"
                      >
                        Business
                      </Link>
                      <Link
                        to="/?category=exclusive"
                        className="font-display text-lg uppercase tracking-[0.2em] text-blue-200/70 hover:text-rep transition-colors whitespace-nowrap"
                      >
                        Exclusives
                      </Link>
                    </>
                  )}
                  <Link
                    to="/?category=fashion"
                    className="font-display text-lg uppercase tracking-[0.2em] text-blue-200/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    Fashion
                  </Link>
                  <Link
                    to="/?category=health"
                    className="font-display text-lg uppercase tracking-[0.2em] text-blue-200/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    Health
                  </Link>
                </div>
              </div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-4 w-64 mt-2 !bg-dem-dark border border-blue-900/50 shadow-xl py-6 px-4 flex flex-col gap-6 rounded-xl max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent"
                  >
                    {/* Main Nav Links */}
                    <div className="flex flex-col items-center gap-6">
                      {navLinks.map((link) => (
                        <Link
                          key={link.name}
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          className={`font-display text-2xl md:text-3xl uppercase tracking-tighter hover:text-rep transition-colors ${
                            location.pathname === link.path ? "text-blue-50" : "text-blue-200/70"
                          }`}
                        >
                          {link.name}
                        </Link>
                      ))}
                      {/* Mobile Actions */}
                      <div className="flex flex-col items-center gap-4 mt-8 pt-8 border-t border-blue-900/30 w-full max-w-[200px]">
                        {isAuthenticated ? (
                          <>
                            <Link
                              to="/dashboard"
                              onClick={() => setIsOpen(false)}
                              className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold"
                            >
                              My Dashboard
                            </Link>
                            {isAdmin && (
                              <Link
                                to="/admin"
                                onClick={() => setIsOpen(false)}
                                className="text-xs uppercase tracking-[0.3em] text-rep font-bold"
                              >
                                Admin Panel
                              </Link>
                            )}
                          </>
                        ) : (
                          <Link
                            to="/login"
                            onClick={() => setIsOpen(false)}
                            className="text-xs uppercase tracking-[0.3em] text-blue-200/50 font-bold"
                          >
                            Sign In
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

    </>
  );
}
