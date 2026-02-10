import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, Zap, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/use-cart";
import { useAccount } from "../hooks/useAccount";
import { SearchBar } from "./SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import { useHeaderVisible } from "../hooks/useHeaderVisible";
import { useCategories } from "../hooks/useCategories";
import { useAdmin } from "@/hooks/useAdmin";
import logo from "/logo.svg";
import mobileSeal from "../assets/mobile-seal.png";
import { cn } from "@/lib/utils";

import { useCapabilities } from "../hooks/useCapabilities";

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
  const { session, isAdmin, loading: authLoading } = useAuth();
  const isAuthenticated = !!session;
  const { data: categories } = useCategories();
  const isVisible = useHeaderVisible();
  const location = useLocation();
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { capabilities } = useCapabilities();
  const { isAdminMode, toggleAdminMode } = useAdmin();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
  };

  const { activeAccount, isLoading: isLoadingAccount } = useAccount();

  const currentNavLinks = isAuthenticated ? [] : [];

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
            className="fixed top-10 left-0 right-0 z-50 bg-dem-dark border-b border-dem/50 lg:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]"
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

                    <span className="font-display text-2xl md:text-5xl tracking-widest text-dem leading-none">
                      STREETPOLY <span className="text-rep ml-1">NEWS</span>
                    </span>

                  </Link>
                </div>



                  {/* Actions (Search & Cart) */}
                  <div className="flex items-center gap-2">
                    {/* Admin Link (Desktop Only) */}
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleAdminMode}
                          className={cn(
                            "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group mr-2",
                            isAdminMode 
                              ? "bg-dem text-white border-dem shadow-[0_0_15px_rgba(0,71,171,0.3)] animate-pulse" 
                              : "bg-dem/10 border-dem/20 text-dem hover:bg-dem/20"
                          )}
                          title={isAdminMode ? "Exit Conduction Mode" : "Enter Conduction Mode"}
                        >
                          <Zap size={18} className={cn(isAdminMode && "fill-current")} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                            {isAdminMode ? "Conduction Active" : "Conduction Mode"}
                          </span>
                        </button>

                        <Link
                          to="/admin"
                          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-rep/10 border border-rep/20 text-rep hover:bg-rep/20 transition-all group mr-2"
                          title="Admin Panel"
                        >
                          <Zap size={18} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Admin</span>
                        </Link>
                      </div>
                    )}

                    {/* User Info & Debug Indicator */}
                    {session?.user && (
                      <div className="flex flex-col items-end mr-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] text-white/70 uppercase leading-tight backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          {!isAdmin && (
                            <div className="flex gap-1.5">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-sm font-bold text-[8px] tracking-wider",
                                capabilities.length > 0 ? "bg-dem/20 text-dem border border-dem/30" : "bg-white/5 text-white/40 border border-white/10"
                              )}>
                                {capabilities.length > 0 ? "PARTNER" : "VIEWER"}
                              </span>
                              {capabilities.length > 0 && (
                                <span className="bg-white/5 text-white/40 border border-white/10 px-1.5 py-0.5 rounded-sm font-bold text-[8px] tracking-wider">
                                  VIEWER
                                </span>
                              )}
                            </div>
                          )}
                          {isAdmin && (
                            <span className="bg-rep/20 text-rep border border-rep/30 px-1.5 py-0.5 rounded-sm font-bold text-[8px] tracking-wider">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <span className="opacity-50 text-[8px] font-medium mt-1 lowercase tracking-normal">{session.user.email}</span>
                      </div>
                    )}

                    {/* Search Toggle (Desktop only shows if search hidden, Mobile always shows) */}
                    {(!showSearch || window.innerWidth < 1024) && (
                      <button
                        type="button"
                        onClick={() => setShowSearch(!showSearch)}
                        aria-label="Search"
                        className="p-2 text-white/70 hover:text-rep transition-colors"
                      >
                        <Search size={24} />
                      </button>
                    )}

                    {/* Shopping Bag */}
                    <button
                      type="button"
                      onClick={() => setCartOpen(true)}
                      className="p-2 text-white/70 hover:text-rep transition-colors relative"
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
                      className="p-2 text-white/70 hover:text-rep transition-colors"
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
                    className="absolute top-full left-0 right-0 bg-dem-dark border-b border-dem/50 p-4 flex justify-center z-40"
                  >
                    <SearchBar 
                      className="w-full max-w-2xl" 
                      onClose={() => setShowSearch(false)} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-dem/50 py-2 md:py-3 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex items-center justify-start md:justify-center gap-x-6 md:gap-x-8 px-4 min-w-max mx-auto">
                  <Link
                    to="/"
                    className="font-display text-lg uppercase tracking-[0.2em] text-white/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    All
                  </Link>
                  <Link
                    to="/?category=politics"
                    className="font-display text-lg uppercase tracking-[0.2em] text-white/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    Politics
                  </Link>
                  <Link
                    to="/?category=entertainment"
                    className="font-display text-lg uppercase tracking-[0.2em] text-white/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    Entertainment
                  </Link>
                  <Link
                    to="/?category=business"
                    className="font-display text-lg uppercase tracking-[0.2em] text-white/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    Business
                  </Link>
                  <Link
                    to="/?category=exclusive"
                    className="font-display text-lg uppercase tracking-[0.2em] text-white/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    Exclusives
                  </Link>
                  <Link
                    to="/?category=fashion"
                    className="font-display text-lg uppercase tracking-[0.2em] text-white/70 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    Fashion
                  </Link>
                  <Link
                    to="/?category=health"
                    className="font-display text-lg uppercase tracking-[0.2em] text-white/70 hover:text-rep transition-colors whitespace-nowrap"
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
                    className="absolute top-full right-4 w-64 mt-2 !bg-dem-dark border border-dem/50 shadow-xl py-6 px-4 flex flex-col gap-6 rounded-xl max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-thin scrollbar-thumb-dem/50 scrollbar-track-transparent"
                  >
                    {/* Main Nav Links */}
                    <div className="flex flex-col items-center gap-6">
                      {navLinks.map((link) => (
                        <Link
                          key={link.name}
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          className={`font-display text-2xl md:text-3xl uppercase tracking-tighter hover:text-rep transition-colors ${
                            location.pathname === link.path ? "text-white" : "text-white/70"
                          }`}
                        >
                          {link.name}
                        </Link>
                      ))}
                      {/* Mobile Actions */}
                      <div className="flex flex-col items-center gap-4 mt-8 pt-8 border-t border-dem/30 w-full max-w-[200px]">
                        {!isAuthenticated && (
                          <Link
                            to="/login"
                            onClick={() => setIsOpen(false)}
                            className="text-xs uppercase tracking-[0.3em] text-dem/70 hover:text-rep font-bold transition-colors"
                          >
                            Sign In
                          </Link>
                        )}
                        
                        {isAuthenticated && (
                          <>
                            <Link
                              to="/dashboard"
                              onClick={() => setIsOpen(false)}
                              className="text-xs uppercase tracking-[0.3em] text-dem font-bold"
                            >
                              My Dashboard
                            </Link>
                            
                            {isAdmin && (
                              <>
                                <Link
                                  to="/admin/queue"
                                  onClick={() => setIsOpen(false)}
                                  className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white font-bold"
                                >
                                  Orders
                                </Link>
                                <Link
                                  to="/admin/submissions"
                                  onClick={() => setIsOpen(false)}
                                  className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white font-bold"
                                >
                                  Requests
                                </Link>
                                <Link
                                  to="/admin"
                                  onClick={() => setIsOpen(false)}
                                  className="text-xs uppercase tracking-[0.3em] text-rep font-bold"
                                >
                                  Admin Panel
                                </Link>
                              </>
                            )}

                            {capabilities.length > 0 && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-dem/10 border border-dem/20 rounded-full mt-2">
                                <Zap className="w-3 h-3 text-dem" />
                                <span className="text-[10px] font-bold text-dem uppercase tracking-wider">
                                  {capabilities.length} Active
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={handleSignOut}
                              className="text-xs uppercase tracking-[0.3em] text-rep hover:text-rep/80 font-bold transition-colors mt-4"
                            >
                              Sign Out
                            </button>
                          </>
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
