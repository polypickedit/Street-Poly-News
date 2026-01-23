import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { SearchBar } from "@/components/SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useCategories } from "@/hooks/useCategories";
import logo from "@/assets/logo.svg";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Videos", path: "/#videos" },
  { name: "Gallery", path: "/gallery" },
  { name: "Merch", path: "/merch" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { data: categories } = useCategories();
  const isVisible = useHeaderVisible();
  const location = useLocation();
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  // Force header visible when menu is open
  const headerVisible = isOpen || isVisible;

  return (
    <>
      <AnimatePresence>
        {headerVisible && (
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-[36px] left-0 right-0 z-50 bg-dem-dark backdrop-blur-sm border-b border-white/10 shadow-sm"
          >
            <div className="container mx-auto px-4 relative">
              <div className="flex items-center justify-between h-32 md:h-44">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 sm:gap-5 md:gap-10 group transition-transform hover:scale-[1.02] shrink-0"
                >
                  <div className="bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-white/20 transition-all duration-300 border-2 md:border-4 border-white">
                    <img 
                      src={logo} 
                      alt="Streetpoly News" 
                      className="w-12 h-12 sm:w-24 sm:h-24 md:w-32 md:h-32 object-cover group-hover:rotate-3 transition-transform scale-[1.02]"
                    />
                  </div>
                  <span className="font-display text-xl sm:text-3xl md:text-6xl tracking-widest text-white leading-none">
                    STREETPOLY <span className="text-rep ml-1 md:ml-2">NEWS</span>
                  </span>
                </Link>

                {/* Desktop Search Bar - Centered */}
                <div className="hidden lg:flex flex-1 justify-center px-8">
                  {showSearch && (
                    <SearchBar 
                      className="w-full max-w-md" 
                      onClose={() => setShowSearch(false)} 
                    />
                  )}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Search Toggle (Desktop) */}
                  {!showSearch && (
                    <button
                      onClick={() => setShowSearch(true)}
                      aria-label="Search"
                      className="hidden lg:block p-2 text-blue-100/70 hover:text-white transition-colors"
                    >
                      <Search size={24} />
                    </button>
                  )}

                  {/* Shopping Bag */}
                  <button
                    onClick={() => setCartOpen(true)}
                    aria-label="Open cart"
                    className="relative p-2 text-blue-100/70 hover:text-white transition-colors"
                    title="Merch Store"
                  >
                    <ShoppingBag size={24} />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rep text-white text-xs font-body w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                        {totalItems}
                      </span>
                    )}
                  </button>

                  {/* Hamburger Menu Button */}
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-blue-100/70 hover:text-white transition-colors"
                    aria-label="Toggle menu"
                  >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/5 py-3 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex items-center justify-start md:justify-center gap-x-6 md:gap-x-8 px-4 min-w-max mx-auto">
                  <Link
                    to="/"
                    className="font-display text-base uppercase tracking-[0.2em] text-slate-400 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    All
                  </Link>
                  {categories?.map((category) => (
                    <Link
                      key={category.id}
                      to={`/?category=${category.slug}`}
                      className="font-display text-base uppercase tracking-[0.2em] text-slate-400 hover:text-rep transition-colors whitespace-nowrap"
                    >
                      {category.slug === "exclusive" ? "Exclusives" : category.name}
                    </Link>
                  ))}
                  <Link
                    to="/?category=fashion"
                    className="font-display text-base uppercase tracking-[0.2em] text-slate-400 hover:text-rep transition-colors whitespace-nowrap"
                  >
                    Fashion
                  </Link>
                  <Link
                    to="/?category=health"
                    className="font-display text-base uppercase tracking-[0.2em] text-slate-400 hover:text-rep transition-colors whitespace-nowrap"
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
                    className="absolute top-full right-4 w-64 mt-2 bg-dem-dark border border-white/10 shadow-xl py-6 px-4 flex flex-col gap-6 rounded-xl max-h-[80vh] overflow-y-auto"
                  >
                    {/* Main Nav Links */}
                    <div className="flex flex-col items-center gap-6">
                      {navLinks.map((link) => (
                        <Link
                          key={link.name}
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          className={`font-display text-xl md:text-2xl uppercase tracking-tighter hover:text-rep transition-colors ${
                            location.pathname === link.path ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {link.name}
                        </Link>
                      ))}
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
