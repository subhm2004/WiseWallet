import { Suspense } from "react";
import AuthCallbackPage from "./page";

export default function AuthCallbackLayout() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <AuthCallbackPage />
    </Suspense>
  );
}
