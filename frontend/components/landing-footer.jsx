import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Testimonials", href: "/#testimonials" },
    { label: "FAQ", href: "/#faq" },
  ],
  App: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Reports", href: "/reports" },
    { label: "Subscriptions", href: "/subscriptions" },
    { label: "Add Transaction", href: "/transaction/create" },
  ],
  Account: [
    { label: "Sign In", href: "/sign-in" },
    { label: "Create Account", href: "/sign-in" },
  ],
};

const GITHUB_URL = "https://github.com/subhm2004/WiseWallet";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="container mx-auto px-4 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 flex flex-col gap-5 max-w-md">
            <Link href="/" className="inline-flex w-fit">
              <Logo size="md" />
            </Link>
            <p className="text-muted-foreground text-[15px] leading-7">
              Track expenses, set budgets, and get AI-powered insights — all in
              INR. Your complete personal finance companion.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/sign-in">
                <Button className="gap-2 h-11 px-6 shadow-none">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-4 rounded-md text-sm text-muted-foreground hover:text-foreground border border-border/60 hover:border-orange-500/30 hover:bg-orange-500/5 transition-colors"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <h3 className="font-semibold text-sm mb-4">{title}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {year} WiseWallet. All rights reserved. Built for India, priced in
            INR.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/30 hover:bg-orange-500/5 transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
