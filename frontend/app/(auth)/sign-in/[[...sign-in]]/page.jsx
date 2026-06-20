"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Bot, Loader2, Shield, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, setAuthTokens } from "@/lib/api";
import { Logo } from "@/components/logo";
import { safeRedirect, storeAuthRedirect } from "@/lib/auth-redirect";

const FEATURES = [
  { icon: Wallet, text: "Unified account and transaction management in INR" },
  { icon: BarChart3, text: "Detailed reports, budgets, and spending analytics" },
  { icon: Bot, text: "Personalized financial guidance from your data" },
  { icon: Shield, text: "Secure authentication via email or Google" },
];

const ERROR_MESSAGES = {
  no_code: "Google sign-in was cancelled.",
  token_failed: "Could not complete Google sign-in.",
  user_info_failed: "Could not get your Google profile.",
  oauth_failed: "Google sign-in failed. Try again.",
  auth_failed: "Sign in failed. Please try again.",
};

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const modeParam = searchParams.get("mode");
  const redirectTo = searchParams.get("redirect");

  const [mode, setMode] = useState(
    modeParam === "register" ? "register" : modeParam === "forgot" ? "forgot" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "forgot") {
      if (!email) {
        toast.error("Enter your email");
        return;
      }
      setLoading(true);
      try {
        await api.auth.forgotPassword(email);
        toast.success("Check your email for a reset link");
        setMode("login");
      } catch (err) {
        toast.error(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    if (mode === "register" && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await api.auth.login(email, password)
          : await api.auth.register(email, password, name);

      setAuthTokens({ token: data.token, refreshToken: data.refreshToken });
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      router.replace(safeRedirect(redirectTo));
    } catch (err) {
      if (err.message?.includes("Google sign-in")) {
        toast.error(err.message, { duration: 5000 });
      } else {
        toast.error(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div className="hidden lg:block space-y-8">
        <div>
          <Logo size="lg" className="mb-6" />
          <h1 className="text-5xl font-bold gradient-title leading-tight pb-2">
            Your money,<br />smarter.
          </h1>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed max-w-md">
            A modern platform to monitor, plan, and optimize your personal finances.
          </p>
        </div>
        <ul className="space-y-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-base">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                <Icon className="h-5 w-5 text-orange-500" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <Card className="w-full shadow-lg border-border/60">
        <CardContent className="p-8 sm:p-10 space-y-6">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <Logo size="md" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold gradient-title">
              {mode === "login"
                ? "Welcome back"
                : mode === "forgot"
                  ? "Reset password"
                  : "Create account"}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mt-3">
              {mode === "login"
                ? "Access your dashboard with email or Google"
                : mode === "forgot"
                  ? "We'll email you a link to reset your password"
                  : "Create your account to get started"}
            </p>
          </div>

          {mode !== "forgot" && (
          <div className="flex rounded-lg border p-1 bg-muted/40">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                mode === "login"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                mode === "register"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>
          )}

          {errorCode && (
            <p className="text-base text-red-500 text-center bg-red-500/10 rounded-lg py-3 px-4">
              {ERROR_MESSAGES[errorCode] || "Sign in failed. Please try again."}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <Input
                type="text"
                placeholder="Full name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base"
                disabled={loading}
              />
            )}
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              autoComplete="email"
              disabled={loading}
              required
            />
            {mode !== "forgot" && (
            <Input
              type="password"
              placeholder={mode === "register" ? "Password (min 6 chars)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              disabled={loading}
              required
            />
            )}
            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm text-orange-600 hover:underline text-left"
              >
                Forgot password?
              </button>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "login" ? (
                "Sign In with Email"
              ) : mode === "forgot" ? (
                "Send reset link"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {mode === "forgot" ? (
            <p className="text-center text-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-muted-foreground hover:underline"
              >
                ← Back to sign in
              </button>
            </p>
          ) : (
          <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 text-base gap-3"
            type="button"
            onClick={() => {
              if (redirectTo) storeAuthRedirect(redirectTo);
              window.location.href = "/api/auth/google";
            }}
          >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

          </>
          )}

          <p className="text-center text-base text-muted-foreground">
            <Link href="/" className="hover:underline hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
