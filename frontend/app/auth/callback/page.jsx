"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthTokens, api } from "@/lib/api";
import { consumeAuthRedirect } from "@/lib/auth-redirect";
import { BarLoader } from "react-spinners";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function finish() {
      const token = searchParams.get("token");
      if (!token) {
        router.replace("/sign-in?error=auth_failed");
        return;
      }

      setAuthTokens({ token });
      try {
        const session = await api.auth.createSession();
        if (session?.refreshToken) {
          setAuthTokens({ token, refreshToken: session.refreshToken });
        }
      } catch {
        // access token still valid for 1h
      }
      router.replace(consumeAuthRedirect("/dashboard"));
    }

    finish();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <BarLoader color="hsl(var(--primary))" width={200} />
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
