import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalkthroughStep {
  id: string;
  title: string;
  content: string;
  subContent?: string;
  targetSelector?: string; // CSS selector to spotlight
  action?: () => void; // Optional action to trigger (e.g. open drawer)
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const steps: WalkthroughStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Control Room",
    content: "You don’t edit pages here. You conduct them.",
    subContent: "Let's take a quick tour of how you act with authority.",
    position: "center",
  },
  {
    id: "live-site",
    title: "This is the live site",
    content: "What you see is exactly what users see.",
    subContent: "When Conduction Mode is on, you’re viewing the site through an admin lens—nothing here is a draft or preview.",
    position: "center",
  },
  {
    id: "slots",
    title: "This is a Slot",
    content: "A slot is a named position on the site (like home.hero).",
    subContent: "Slots don’t store content—they receive it. Highlighted areas are conductable.",
    targetSelector: '[data-slot="home.hero"]',
    position: "bottom",
  },
  {
    id: "intentionality",
    title: "Conduction Mode is intentional",
    content: "When it’s on, you may assign, schedule, or revert content.",
    subContent: "Shortcut: Ctrl + Alt + A. When it’s off, the site is read-only.",
    targetSelector: "[data-conduction-toggle]", // We'll add this ID to the toggle
    position: "bottom",
  },
  {
    id: "drawer",
    title: "This is where decisions are made",
    content: "From here you can swap content, adjust priority, and schedule visibility.",
    subContent: "Every change records why it was made. This protects you and the team later.",
    targetSelector: '[data-slot="home.hero"]', // Spotlight the hero again, but we'll manually open drawer
    action: () => {
      // Logic handled in AdminOverlay to open drawer
    },
    position: "right",
  },
  {
    id: "safety",
    title: "Nothing here is permanent",
    content: "If a slot has no active placement, it safely falls back to its original behavior.",
    subContent: "Every change can be reverted instantly. You can’t break the site by conducting.",
    position: "center",
  },
];

export function ConductWalkthrough() {
  const { isWalkthroughActive, completeWalkthrough, walkthroughStep, setWalkthroughStep } = useAdmin();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = walkthroughStep === -1 
    ? { id: "intro", title: "Control Room", content: "Broadcasting with Authority.", position: "center" as const, targetSelector: undefined }
    : steps[walkthroughStep];

  useEffect(() => {
    if (currentStep?.targetSelector) {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [walkthroughStep, currentStep?.targetSelector]);

  if (!isWalkthroughActive) return null;

  const handleNext = () => {
    if (walkthroughStep < steps.length - 1) {
      setWalkthroughStep(walkthroughStep + 1);
    } else {
      completeWalkthrough();
      setWalkthroughStep(-1);
    }
  };

  const handleBack = () => {
    if (walkthroughStep > -1) {
      setWalkthroughStep(walkthroughStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dimmed Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={completeWalkthrough}
        className="absolute inset-0 bg-black/80 pointer-events-auto cursor-pointer"
        style={{
          clipPath: targetRect 
            ? `inset(0 0 0 0 round 0) polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)`
            : undefined
        }}
      />

      {/* Content Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className={cn(
            "absolute pointer-events-auto bg-black border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full z-[101]",
            currentStep.position === "center" && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            currentStep.position === "bottom" && targetRect && "top-[calc(var(--target-bottom)+20px)] left-1/2 -translate-x-1/2",
            currentStep.position === "right" && targetRect && "left-[calc(var(--target-right)+20px)] top-1/2 -translate-y-1/2",
          )}
          style={{
            "--target-bottom": targetRect ? `${targetRect.bottom}px` : "50%",
            "--target-right": targetRect ? `${targetRect.right}px` : "50%",
          } as React.CSSProperties}
        >
          {walkthroughStep === -1 ? (
            <div className="text-center space-y-6">
              <div className="flex justify-end -mb-12">
                <button 
                  onClick={completeWalkthrough} 
                  className="text-white/40 hover:text-white transition-colors p-1"
                  aria-label="Close walkthrough"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-20 h-20 bg-dem/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-8 h-8 text-dem fill-current" />
              </div>
              <h2 className="text-3xl font-display text-white">Welcome to the Control Room</h2>
              <p className="text-white/40 font-body text-lg">
                You don’t edit pages here. <br />
                <span className="text-white font-bold">You conduct them.</span>
              </p>
              <Button 
                onClick={() => setWalkthroughStep(0)}
                className="w-full bg-dem hover:bg-dem/90 text-white h-12 rounded-xl text-lg font-bold shadow-lg shadow-dem/20 transition-all hover:scale-[1.02]"
              >
                Begin Walkthrough
              </Button>
              <button 
                onClick={completeWalkthrough}
                className="text-white/40 text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Skip Tour
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-dem">
                  Step {walkthroughStep + 1} of {steps.length}
                </span>
                <button 
                  onClick={completeWalkthrough} 
                  className="text-white/40 hover:text-white transition-colors p-1"
                  aria-label="Close walkthrough"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-display text-white">{currentStep.title}</h3>
              <p className="text-white/60 font-body leading-relaxed">{currentStep.content}</p>
              {currentStep.subContent && (
                <p className="text-white/40 text-sm font-body italic border-l-2 border-dem/30 pl-3">
                  {currentStep.subContent}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
                <button 
                  onClick={handleBack}
                  disabled={walkthroughStep === 0}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white disabled:opacity-0 transition-all"
                >
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
                <Button 
                  onClick={handleNext}
                  size="sm"
                  className="bg-dem hover:bg-dem/90 text-white rounded-lg px-6"
                >
                  {walkthroughStep === steps.length - 1 ? "Finish" : "Next"} 
                  {walkthroughStep !== steps.length - 1 && <ChevronRight className="w-3 h-3 ml-1" />}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
