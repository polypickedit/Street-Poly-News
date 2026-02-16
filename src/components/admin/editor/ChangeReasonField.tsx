import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChangeReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}

export function ChangeReasonField({
  value,
  onChange,
  placeholder = "Why are you making this change?",
  className,
  multiline = false
}: ChangeReasonFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        Reason for Change <span className="font-normal opacity-50 lowercase tracking-normal">(optional)</span>
      </label>
      
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary transition-colors resize-none"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary transition-colors"
        />
      )}
      
      <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
        This helps build institutional memory.
      </p>
    </div>
  );
}
