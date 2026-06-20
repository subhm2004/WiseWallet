import { Suspense } from "react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
        {children}
      </Suspense>
    </div>
  );
}
