import React, { ReactNode } from "react";
import { useSlotContent } from "@/hooks/usePlacements";
import { ContentType, PlacementMetadata } from "@/types/cms";

interface SlotProps {
  /** The unique key for this slot (e.g. "home.hero") */
  slotKey: string;
  /** The content types this slot can accept */
  accepts: ContentType[];
  /** The fallback content to render if no placement is found */
  fallback: ReactNode;
  /** Optional wrapper class for the slot */
  className?: string;
  /** Function to render the resolved content */
  children: (content: { type: ContentType; id: string | null; metadata: PlacementMetadata } | null) => ReactNode;
}

/**
 * The Slot abstraction.
 * Purely declarative and unaware of admin mode.
 * Resolves content via useSlotContent and renders children or fallback.
 */
export function Slot({
  slotKey,
  accepts,
  fallback,
  className,
  children,
}: SlotProps) {
  const { data: placement, isLoading } = useSlotContent(slotKey);

  // While loading, we should probably show the fallback or a skeletal state
  // For now, mirroring the "site survival" rule, we return the fallback.
  if (isLoading || !placement) {
    return (
      <div 
        data-slot={slotKey} 
        data-accepts={accepts.join(",")} 
        className={className}
      >
        {fallback}
      </div>
    );
  }

  // Ensure the placement content type is allowed for this slot
  if (!accepts.includes(placement.content_type as ContentType)) {
    console.warn(`Slot ${slotKey} received unsupported content type: ${placement.content_type}`);
    return (
      <div 
        data-slot={slotKey} 
        className={className}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div 
      data-slot={slotKey} 
      data-accepts={accepts.join(",")} 
      className={className}
    >
      {children({
        type: placement.content_type as ContentType,
        id: placement.content_id,
        metadata: placement.metadata,
      })}
    </div>
  );
}
