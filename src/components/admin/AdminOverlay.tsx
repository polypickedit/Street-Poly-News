import React, { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { ConductDrawer } from "./ConductDrawer";
import { ConductWalkthrough } from "./ConductWalkthrough";
import { ContentType } from "@/types/cms";
import { HelpCircle, Hammer, X, Minus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const clickTimeout = useRef<number | null>(null);
  const pendingSlot = useRef<{ key: string; accepts: ContentType[] } | null>(null);

  // Floating Bar State
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    key: string;
    accepts: ContentType[];
  } | null>(null);
  
  useEffect(() => {
    if (elementRef.current) {
      if (position) {
        elementRef.current.style.left = `${position.x}px`;
        elementRef.current.style.top = `${position.y}px`;
        elementRef.current.style.right = 'auto';
      } else {
        elementRef.current.style.left = 'auto';
        elementRef.current.style.top = '1rem';
        elementRef.current.style.right = '1rem';
      }
    }
  }, [position, isAdminMode]);

  // Drag Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent drag if clicking buttons
    if ((e.target as HTMLElement).closest("button")) return;
    
    e.preventDefault();
    isDragging.current = true;
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    // If position is null (default), set it to current rect
    const currentX = position?.x ?? rect.left;
    const currentY = position?.y ?? rect.top;

    const offsetX = e.clientX - currentX;
    const offsetY = e.clientY - currentY;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !elementRef.current) return;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      
      elementRef.current.style.left = `${x}px`;
      elementRef.current.style.top = `${y}px`;
      elementRef.current.style.right = 'auto';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

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

    window.addEventListener("click", handleClick, true); // Use capture phase to intercept

    return () => {
      window.removeEventListener("click", handleClick, true);
    };
  }, [isAdminMode]);

  if (!isAdminMode) return null;

  return (
    <>
      {/* Global Indicator */}
      <div 
        ref={elementRef}
        data-conduction-toggle
        onMouseDown={handleMouseDown}
        className={cn(
          "fixed z-[10001] flex items-center gap-3 bg-dem/95 text-white shadow-2xl backdrop-blur-md border border-white/20 cursor-grab active:cursor-grabbing transition-all duration-200 ease-out",
          isMinimized ? "p-3 rounded-full" : "px-4 py-2 rounded-full",
          !position && "animate-in fade-in slide-in-from-top-4"
        )}
      >
        <div className="flex items-center gap-2">
          {isMinimized ? (
            <Hammer className="w-4 h-4 text-white" />
          ) : (
            <>
              <GripVertical className="w-4 h-4 text-white/50 -ml-1" />
              <Hammer className="w-4 h-4 animate-pulse" />
              <span className="font-display font-black text-sm tracking-widest uppercase text-white select-none">
                Conduction Mode
              </span>
            </>
          )}
        </div>

        {!isMinimized && (
          <>
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
                type="button"
                onClick={() => setIsWalkthroughActive(true)}
                className="flex items-center gap-1.5 text-white hover:text-white/70 transition-colors px-2 py-1 rounded-full hover:bg-white/10"
                aria-label="Help and Walkthrough"
                title="Help"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Help</span>
              </button>
            </div>
          </>
        )}

        {/* Controls (Minimize/Close) */}
        <div className={cn("flex items-center gap-1", !isMinimized && "border-l border-white/20 pl-2 ml-1")}>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="flex items-center justify-center w-6 h-6 text-white hover:text-white/70 transition-colors rounded-full hover:bg-white/10"
              aria-label={isMinimized ? "Expand" : "Minimize"}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Hammer className="w-3 h-3 animate-pulse" /> : <Minus className="w-4 h-4" />}
            </button>
            
            {!isMinimized && (
              <button 
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleAdminMode();
                }}
                className="flex items-center gap-1.5 text-white hover:text-rep transition-colors px-2 py-1 rounded-full hover:bg-white/10"
                aria-label="Exit Conduction Mode"
                title="Exit"
              >
                <X className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Exit</span>
              </button>
            )}
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
      <style>{`
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
      `}</style>
    </>
  );
}
