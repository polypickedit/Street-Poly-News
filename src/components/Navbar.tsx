import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { SearchBar } from "@/components/SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import logo from "@/assets/logo.svg";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Videos", path: "/#videos" },
  { name: "Merch", path: "/merch" },
  { name: "About", path: "/about" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const isVisible = useHeaderVisible();
  const location = useLocation();
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-[36px] left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm"
        >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-transform hover:scale-[1.02]"
          >
            <img 
              src={logo} 
              alt="Streetpoly News" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain group-hover:rotate-3 transition-transform"
            />
            <span className="font-display text-xl md:text-2xl tracking-tight text-dem">
              STREETPOLY <span className="text-rep">NEWS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`font-body text-sm font-medium uppercase tracking-wider transition-colors hover:text-dem ${
                  location.pathname === link.path
                    ? "text-dem"
                    : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Search */}
            <div className="relative">
              {showSearch ? (
                <SearchBar 
                  className="w-64" 
                  onClose={() => setShowSearch(false)} 
                />
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  aria-label="Search"
                  className="p-2 text-muted-foreground hover:text-dem transition-colors"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative p-2 text-muted-foreground hover:text-dem transition-colors"
              title="Merch Store"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-rep text-rep-foreground text-xs font-body w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              aria-label="Toggle search"
              className="p-2 text-foreground"
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative p-2 text-foreground"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-rep text-rep-foreground text-xs font-body w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              className="p-2 text-foreground"
              aria-label="Toggle menu"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="lg:hidden pb-4 animate-slide-down">
            <SearchBar onClose={() => setShowSearch(false)} />
          </div>
        )}

        {/* Mobile Nav */}
        {isOpen && (
          <div className="lg:hidden pt-4 pb-4 animate-slide-down">
            {navLinks.map((link, index) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block py-3 font-body text-sm font-medium uppercase tracking-wider transition-colors hover:text-dem opacity-0 animate-slide-down delay-${index % 11} ${
                  location.pathname === link.path
                    ? "text-dem"
                    : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
        </div>
      </motion.nav>
      )}
    </AnimatePresence>
  );
}
