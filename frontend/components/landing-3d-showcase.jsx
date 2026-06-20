"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FinanceBars3D = dynamic(() => import("./finance-bars-3d"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
    </div>
  ),
});

export function Landing3DShowcase() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!prefersReduced);
  }, []);

  return (
    <section className="relative py-16 lg:py-20 border-b border-border/60 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.04] via-background to-background pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <Badge variant="section" className="mb-5 sm:mb-6">
              3D Analytics Preview
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Watch your wealth{" "}
              <span className="gradient-title pr-0 pb-0">grow</span> in real time
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
              Interactive 3D visualizations turn boring spreadsheets into
              insights you can actually feel — powered by Three.js on your
              landing experience.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-orange-500 font-medium">
              <TrendingUp className="h-4 w-4" />
              Live portfolio momentum
            </div>
          </div>

          <div className="order-1 lg:order-2 relative h-[280px] sm:h-[320px] lg:h-[360px] rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12),transparent_65%)] pointer-events-none z-10" />
            {enabled ? (
              <FinanceBars3D />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground px-6 text-center">
                3D preview available with motion enabled
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
