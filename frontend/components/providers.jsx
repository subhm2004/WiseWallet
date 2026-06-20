"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors />
    </ThemeProvider>
  );
}
