"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const HeroScene3D = dynamic(() => import("./hero-scene-3d"), {
  ssr: false,
  loading: () => null,
});

export function Hero3DBackground() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallScreen = window.innerWidth < 768;

    setEnabled(!prefersReduced && !isSmallScreen);
  }, []);

  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-90"
      aria-hidden="true"
    >
      <HeroScene3D />
    </div>
  );
}
