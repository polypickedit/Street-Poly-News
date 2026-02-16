import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SaveBarProps {
  onSave: () => void;
  isSaving: boolean;
  isDisabled: boolean;
  label?: string;
  description?: string;
  className?: string;
  error?: string | null;
}

export function SaveBar({
  onSave,
  isSaving,
  isDisabled,
  label = "Save Changes",
  description = "Actions are logged for audit.",
  className,
  error
}: SaveBarProps) {
  return (
    <div className={cn(
      "sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/50 p-4 space-y-3 z-10",
      className
    )}>
      <Button 
        className={cn(
          "w-full h-12 font-bold shadow-lg transition-all",
          isSaving ? "opacity-80 cursor-not-allowed" : "hover:scale-[1.01]"
        )}
        disabled={isDisabled || isSaving}
        onClick={onSave}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        {label}
      </Button>
      
      {error && (
        <div className="flex items-center justify-center gap-2 text-xs text-destructive font-medium">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
      
      {description && (
        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider opacity-60">
          {description}
        </p>
      )}
    </div>
  );
}
