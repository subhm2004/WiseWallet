"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { faqData } from "@/data/landing";

export function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {faqData.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="rounded-xl border border-border/60 bg-card/50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="font-medium text-sm sm:text-base">{item.q}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
