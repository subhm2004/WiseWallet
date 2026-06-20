"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LayoutDashboard, LogOut, Mail, PenBox, BarChart3, Settings, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { api, AUTH_CHANGED_EVENT, getToken } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

function UserAvatar({ user, size = "md" }) {
  const initial =
    user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  const sizeClass = size === "sm" ? "h-9 w-9 text-sm" : "h-10 w-10 text-sm";

  if (user.imageUrl) {
    return (
      <Image
        src={user.imageUrl}
        alt={user.name || "User"}
        width={40}
        height={40}
        className={`rounded-full object-cover ring-2 ring-background ${sizeClass}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold shrink-0 ring-2 ring-background ${sizeClass}`}
    >
      {initial}
    </div>
  );
}

const Header = () => {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.auth
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshUser();
  }, [pathname, refreshUser]);

  useEffect(() => {
    window.addEventListener(AUTH_CHANGED_EVENT, refreshUser);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, refreshUser);
  }, [refreshUser]);

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href={user ? "/dashboard" : "/"} className="shrink-0">
          <Logo size="md" />
        </Link>

        {!user && !loading && (
          <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a
              href="/#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="/#testimonials"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </a>
            <a
              href="/#faq"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {!user && !loading && (
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="h-9 px-4 rounded-lg font-medium border-border/70 bg-background/50 hover:bg-muted/40"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-in?mode=register">
                <Button className="h-9 px-4 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white shadow-sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 shadow-none ${
                      pathname.startsWith("/dashboard") ? "bg-accent font-medium" : ""
                    }`}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/transaction/create">
                  <Button
                    size="sm"
                    className={`gap-2 shadow-none ${
                      pathname.startsWith("/transaction") ? "opacity-90" : ""
                    }`}
                  >
                    <PenBox size={16} />
                    Add Transaction
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 shadow-none hidden lg:flex ${
                      pathname.startsWith("/reports") ? "bg-accent font-medium" : ""
                    }`}
                  >
                    <BarChart3 size={16} />
                    Reports
                  </Button>
                </Link>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    aria-label="Open profile menu"
                  >
                    <UserAvatar user={user} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-5 text-white">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">
                          {user.name || "WiseWallet User"}
                        </p>
                        <p className="text-sm text-orange-100 truncate flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer py-2.5">
                        <LayoutDashboard />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/transaction/create"
                        className="cursor-pointer py-2.5"
                      >
                        <PenBox />
                        Add Transaction
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/reports" className="cursor-pointer py-2.5">
                        <BarChart3 />
                        Reports
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer py-2.5">
                        <Settings />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscriptions" className="cursor-pointer py-2.5">
                        <RefreshCw />
                        Subscriptions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/splits" className="cursor-pointer py-2.5">
                        <Users />
                        Split Expenses
                      </Link>
                    </DropdownMenuItem>

                    <ThemeToggle variant="menu" />
                  </div>

                  <DropdownMenuSeparator className="my-0" />

                  <div className="p-3 bg-muted/20">
                    <DropdownMenuItem
                      className="w-full justify-center gap-2 rounded-lg border border-border/60 bg-background/80 px-4 py-2.5 font-medium text-muted-foreground cursor-pointer focus:text-orange-600 focus:bg-orange-500/10 focus:border-orange-500/40 dark:focus:text-orange-400"
                      onClick={() => api.auth.logout()}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            loading && (
              <div className="h-10 w-24 rounded-full bg-muted/50 animate-pulse" />
            )
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
