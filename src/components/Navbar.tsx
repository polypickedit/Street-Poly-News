import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { SearchBar } from "@/components/SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useCategories } from "@/hooks/useCategories";
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
  const { data: categories } = useCategories();
  const isVisible = useHeaderVisible();
  const location = useLocation();
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-[36px] left-0 right-0 z-50 bg-dem-dark backdrop-blur-sm border-b border-white/10 shadow-sm"
          >
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-32 md:h-44">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 sm:gap-5 md:gap-10 group transition-transform hover:scale-[1.02]"
                >
                  <div className="bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-white/20 transition-all duration-300 border-2 md:border-4 border-white">
                    <img 
                      src={logo} 
                      alt="Streetpoly News" 
                      className="w-12 h-12 sm:w-24 sm:h-24 md:w-32 md:h-32 object-cover group-hover:rotate-3 transition-transform scale-[1.02]"
                    />
                  </div>
                  <span className="font-display text-xl sm:text-3xl md:text-6xl tracking-normal text-white leading-none">
                    STREETPOLY <span className="text-rep ml-1 md:ml-2">NEWS</span>
                  </span>
                </Link>

                {/* Navigation Controls */}
                <div className="flex items-center gap-4">
                  {/* Search (Desktop only) */}
                  <div className="hidden lg:block relative">
                    {showSearch ? (
                      <SearchBar 
                        className="w-64" 
                        onClose={() => setShowSearch(false)} 
                      />
                    ) : (
                      <button
                        onClick={() => setShowSearch(true)}
                        aria-label="Search"
                        className="p-2 text-blue-100/70 hover:text-white transition-colors"
                      >
                        <Search size={24} />
                      </button>
                    )}
                  </div>

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
                    className={`p-4 rounded-full transition-all duration-300 z-[70] shadow-lg border-2 ${
                      isOpen 
                        ? "bg-white text-dem-dark border-white scale-110 rotate-90" 
                        : "bg-dem-dark text-white border-white/20 hover:scale-110 hover:border-white/40"
                    }`}
                    aria-label="Toggle menu"
                  >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Full-Screen Overlay Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[60] bg-dem-dark/80 backdrop-blur-xl overflow-y-auto flex flex-col pt-44 md:pt-68"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="container mx-auto px-4 pb-8 flex justify-end lg:hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <SearchBar className="w-full max-w-md" />
            </div>

            <div
              className="flex-1 flex items-start justify-center p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <nav className="w-full max-w-4xl mx-auto">
                <ul className="flex flex-col items-center justify-center text-center gap-8 lg:gap-12">
                  {navLinks.map((link, index) => (
                    <li key={link.name} className="w-full text-center">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          className={`font-display text-4xl sm:text-6xl lg:text-8xl uppercase tracking-tighter transition-all hover:text-rep block py-2 ${
                            location.pathname === link.path
                              ? "text-white"
                              : "text-slate-300"
                          }`}
                        >
                          {link.name}
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                  
                  <li className="w-full flex flex-col items-center justify-center text-center gap-4 mt-8 pt-8 border-t border-white/10">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: navLinks.length * 0.1 }}
                      className="flex flex-col items-center justify-center text-center gap-4"
                    >
                      {categories?.map((category) => (
                        <Link
                          key={category.id}
                          to={`/?category=${category.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="font-display text-xl sm:text-2xl uppercase tracking-widest text-slate-400 hover:text-rep transition-colors"
                        >
                          {category.slug === "exclusive" ? "Exclusives" : category.name}
                        </Link>
                      ))}
                      <Link
                        to="/?category=fashion"
                        onClick={() => setIsOpen(false)}
                        className="font-display text-xl sm:text-2xl uppercase tracking-widest text-slate-400 hover:text-rep transition-colors"
                      >
                        Fashion
                      </Link>
                    </motion.div>
                  </li>

                  <li className="mt-auto pt-12 text-center w-full">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (navLinks.length + 1) * 0.1 }}
                    >
                      <div className="flex justify-center gap-8 mb-8">
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">YOUTUBE</a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">TWITTER</a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">INSTAGRAM</a>
                      </div>
                      <p className="text-slate-500 font-body text-[10px] uppercase tracking-[0.4em]">
                        STREETPOLY NEWS • INDEPENDENT MEDIA • EST. 2026
                      </p>
                    </motion.div>
                  </li>
                </ul>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
