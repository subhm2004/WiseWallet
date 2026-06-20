"use client";

import { Suspense } from "react";
import { BarLoader } from "react-spinners";

export function SearchParamsBoundary({ children, className = "mt-4" }) {
  return (
    <Suspense
      fallback={
        <BarLoader className={className} width="100%" color="hsl(var(--primary))" />
      }
    >
      {children}
    </Suspense>
  );
}
