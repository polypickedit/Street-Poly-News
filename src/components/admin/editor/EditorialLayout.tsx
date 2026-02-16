import React from "react";
import { cn } from "@/lib/utils";

interface EditorialLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function EditorialLayout({ children, className }: EditorialLayoutProps) {
  return (
    <div className={cn("flex flex-col md:flex-row h-full bg-background text-foreground", className)}>
      {children}
    </div>
  );
}

interface PreviewAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function PreviewArea({ children, className }: PreviewAreaProps) {
  return (
    <div className={cn("flex-none md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-border bg-muted/10 overflow-y-auto", className)}>
      {children}
    </div>
  );
}

interface ControlPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function ControlPanel({ children, className }: ControlPanelProps) {
  return (
    <div className={cn("flex-1 md:w-1/2 flex flex-col overflow-hidden", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {children}
      </div>
    </div>
  );
}
