import React, { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/hooks/useAdmin";
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
    walkthroughStep,
    activeAdmins,
    hasDismissedWalkthrough
  } = useAdmin();
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const clickTimeout = useRef<number | null>(null);
  const pendingSlot = useRef<{ key: string; accepts: ContentType[] } | null>(null);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    key: string;
    accepts: ContentType[];
  } | null>(null);
  
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        window.clearTimeout(clickTimeout.current);
      }
    };
  }, []);

  // Auto-trigger walkthrough on first activation
  useEffect(() => {
    if (
      isAdminMode &&
      !hasCompletedWalkthrough &&
      !isWalkthroughActive &&
      !hasDismissedWalkthrough
    ) {
      setIsWalkthroughActive(true);
    }
  }, [
    isAdminMode,
    hasCompletedWalkthrough,
    isWalkthroughActive,
    setIsWalkthroughActive,
    hasDismissedWalkthrough,
  ]);

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
      
      // Allow clicks on data-conduction-toggle elements (indicators, close buttons)
      if (target.closest("[data-conduction-toggle]")) {
        return;
      }

      const slotElement = target.closest("[data-slot]");
      if (slotElement) {
        e.preventDefault();
        e.stopPropagation();
        
        const slotKey = slotElement.getAttribute("data-slot");
        const acceptsStr = slotElement.getAttribute("data-accepts") || "";
        const accepts = acceptsStr.split(",").filter(Boolean) as ContentType[];
        
        if (slotKey) {
          const slotData = { key: slotKey, accepts };
          setSelectedSlot(slotData);

          if (clickTimeout.current) {
            window.clearTimeout(clickTimeout.current);
            const previousSlot = pendingSlot.current;
            clickTimeout.current = null;
            pendingSlot.current = null;

            if (previousSlot?.key === slotData.key) {
              setIsDrawerOpen(true);
              return;
            }
          }

          pendingSlot.current = slotData;
          clickTimeout.current = window.setTimeout(() => {
            pendingSlot.current = null;
            clickTimeout.current = null;
          }, 250) as unknown as number;
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

  if (!isAdminMode) return null;

  return (
    <>
      {/* Global Indicator */}
      <div 
        data-conduction-toggle
        className="fixed top-4 right-4 z-[9999] flex items-center gap-3 bg-dem/95 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border border-white/20 animate-in fade-in slide-in-from-top-4"
      >
        <div className="flex items-center gap-2">
          <Hammer className="w-4 h-4 animate-pulse" />
          <span className="font-display font-black text-sm tracking-widest uppercase text-white">
            Conduction Mode
          </span>
        </div>

        {/* Presence Indicator */}
        {activeAdmins.length > 1 && (
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="flex -space-x-2">
              {activeAdmins.slice(0, 3).map((admin, idx) => (
                <div 
                  key={admin.user_id || idx} 
                  className="w-6 h-6 rounded-full border-2 border-dem bg-white/10 flex items-center justify-center text-[8px] font-black uppercase cursor-help shadow-lg text-white"
                  title={`${admin.email} is in the booth`}
                >
                  {admin.email?.substring(0, 2)}
                </div>
              ))}
              {activeAdmins.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-dem bg-white/10 flex items-center justify-center text-[8px] font-black text-white">
                  +{activeAdmins.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-4 w-px bg-white/20 mx-1" />
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsWalkthroughActive(true)}
            className="flex items-center gap-1.5 text-white hover:text-white/70 transition-colors px-2 py-1 rounded-full hover:bg-white/10"
            aria-label="Help and Walkthrough"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider text-white">Help</span>
          </button>
          <button 
            onClick={toggleAdminMode}
            className="flex items-center gap-1.5 text-white hover:text-rep transition-colors px-2 py-1 rounded-full hover:bg-white/10"
            aria-label="Close Conduction Mode"
            title="Close"
          >
            <X className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider text-white">Close</span>
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
          outline: 2px solid #0047AB !important; /* dem color */
          outline-offset: -2px !important;
          cursor: pointer !important;
          filter: brightness(1.1) !important;
        }
        [data-slot]::after {
          content: attr(data-slot);
          position: absolute;
          top: 0;
          left: 0;
          background: #0047AB;
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
          outline: 3px solid #0047AB !important;
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
