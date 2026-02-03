import React, { useState, useEffect } from "react";
import { useAdmin } from "@/providers/AdminProvider";
import { ConductDrawer } from "./ConductDrawer";
import { ConductWalkthrough } from "./ConductWalkthrough";
import { ContentType } from "@/types/cms";
import { HelpCircle, Hammer, X } from "lucide-react";

/**
 * The AdminOverlay component.
 * Intercepts clicks on data-slot elements and opens the conduction drawer.
 * Renders only when isAdminMode is true.
 */
export function AdminOverlay() {
  const { 
    isAdminMode, 
    toggleAdminMode, 
    hasCompletedWalkthrough, 
    isWalkthroughActive, 
    setIsWalkthroughActive,
    walkthroughStep
  } = useAdmin();
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    key: string;
    accepts: ContentType[];
  } | null>(null);

  // Auto-trigger walkthrough on first activation
  useEffect(() => {
    if (isAdminMode && !hasCompletedWalkthrough && !isWalkthroughActive) {
      setIsWalkthroughActive(true);
    }
  }, [isAdminMode, hasCompletedWalkthrough, isWalkthroughActive, setIsWalkthroughActive]);

  // Coordination: Open drawer automatically on step 4 (index 3) of walkthrough
  useEffect(() => {
    if (isWalkthroughActive && walkthroughStep === 3) {
      setSelectedSlot({ key: "home.hero", accepts: ["video"] });
      setIsDrawerOpen(true);
    } else if (isWalkthroughActive && walkthroughStep < 3) {
      setIsDrawerOpen(false);
    }
  }, [isWalkthroughActive, walkthroughStep]);

  useEffect(() => {
    if (!isAdminMode) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const slotElement = target.closest("[data-slot]");
      if (slotElement) {
        setHoveredSlot(slotElement.getAttribute("data-slot"));
      } else {
        setHoveredSlot(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const slotElement = target.closest("[data-slot]");
      if (slotElement) {
        e.preventDefault();
        e.stopPropagation();
        
        const slotKey = slotElement.getAttribute("data-slot");
        const acceptsStr = slotElement.getAttribute("data-accepts") || "";
        const accepts = acceptsStr.split(",").filter(Boolean) as ContentType[];
        
        if (slotKey) {
          setSelectedSlot({ key: slotKey, accepts });
          setIsDrawerOpen(true);
        }
      }
    };

    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("click", handleClick, true); // Use capture phase to intercept

    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("click", handleClick, true);
    };
  }, [isAdminMode]);

  if (!isAdminMode && !isWalkthroughActive) return null;

  return (
    <>
      {/* Global Indicator */}
      <div 
        data-conduction-toggle
        className="fixed top-4 right-4 z-[9999] flex items-center gap-3 bg-dem/90 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border border-white/20 animate-in fade-in slide-in-from-top-4"
      >
        <div className="flex items-center gap-2">
          <Hammer className="w-4 h-4 animate-pulse" />
          <span className="font-display font-bold text-sm tracking-widest uppercase">
            Conduction Mode
          </span>
        </div>
        <div className="h-4 w-px bg-white/20 mx-1" />
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsWalkthroughActive(true)}
            className="flex items-center gap-1.5 hover:text-white/70 transition-colors px-2 py-1 rounded-full hover:bg-white/10"
            aria-label="Help and Walkthrough"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Help</span>
          </button>
          <button 
            onClick={toggleAdminMode}
            className="flex items-center gap-1.5 hover:text-re-700 hover:text-rep transition-colors px-2 py-1 rounded-full hover:bg-white/10"
            aria-label="Close Conduction Mode"
            title="Close"
          >
            <X className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Close</span>
          </button>
        </div>
      </div>

      <ConductWalkthrough />

      {/* Conduct Drawer Integration */}
      {selectedSlot && (
        <ConductDrawer
          slotKey={selectedSlot.key}
          accepts={selectedSlot.accepts}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Style Injection for highlighting */}
      <style dangerouslySetInnerHTML={{ __html: `
        [data-slot] {
          position: relative !important;
          transition: all 0.2s ease-in-out !important;
        }
        [data-slot]:not([data-slot-active="true"]):hover {
          outline: 2px solid #14b8a6 !important; /* dem color */
          outline-offset: -2px !important;
          cursor: pointer !important;
          filter: brightness(1.1) !important;
        }
[data-slot]::after {
          content: attr(data-slot);
          position: absolute;
          top: 0;
          left: 0;
          background: #14b8a6;
          color: white;
          font-family: sans-serif;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          text-transform: uppercase;
          opacity: 0.7; /* Always visible but subtle */
          transition: all 0.2s;
          pointer-events: none;
          z-index: 9999;
          border-bottom-right-radius: 4px;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        }
        [data-slot]:hover {
          outline: 3px solid #14b8a6 !important;
          outline-offset: -3px !important;
        }
        [data-slot]:hover::after {
          opacity: 1;
          transform: scale(1.1);
          transform-origin: top left;
        }
      `}} />
    </>
  );
}
