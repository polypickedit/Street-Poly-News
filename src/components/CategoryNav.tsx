import { Link, useLocation } from "react-router-dom";
import { useHeaderVisible } from "@/hooks/useHeaderVisible";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

export function CategoryNav() {
  const isVisible = useHeaderVisible();
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <motion.div
      initial={false}
      animate={{ 
        top: isVisible ? (isMobile ? 160 : 208) : 36 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 right-0 z-40 border-b border-white/10 bg-dem-dark/95 backdrop-blur-sm"
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-1 overflow-x-auto py-2 px-4 scrollbar-hide">
          <Link
            to="/"
            className={`px-4 py-2 font-body text-sm uppercase tracking-wider whitespace-nowrap transition-colors rounded ${
              location.pathname === "/" && !location.search
                ? "bg-dem text-white shadow-sm"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            All
          </Link>
          <Link
            to="/merch"
            className={`px-6 py-2 font-display text-sm uppercase tracking-widest whitespace-nowrap transition-all rounded-md ml-2 border-2 ${
              location.pathname === "/merch"
                ? "bg-rep text-white border-rep shadow-md scale-105"
                : "border-rep text-rep hover:bg-rep hover:text-white"
            }`}
          >
            Official Store
          </Link>
          {/* Add spacer for better scrolling on mobile */}
          <div className="w-4 flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
