import React from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Settings2 } from "lucide-react";

interface AdvancedSettingsAccordionProps {
  children: React.ReactNode;
  title?: string;
  defaultOpen?: boolean;
  className?: string;
}

export function AdvancedSettingsAccordion({
  children,
  title = "Advanced Settings",
  defaultOpen = false,
  className
}: AdvancedSettingsAccordionProps) {
  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen ? "advanced" : undefined} className={cn("w-full", className)}>
      <AccordionItem value="advanced" className="border-border">
        <AccordionTrigger className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:no-underline hover:text-foreground">
          <span className="flex items-center gap-2">
            <Settings2 className="w-3 h-3" /> {title}
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
