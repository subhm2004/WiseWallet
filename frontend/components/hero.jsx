"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hero3DBackground } from "@/components/hero-3d-background";

const HIGHLIGHTS = [
  "INR-native tracking",
  "AI-powered insights",
  "Bank-grade security",
];

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Hero3DBackground />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(249,115,22,0.15),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40 lg:to-transparent" />
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-red-500/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <Badge variant="section" className="mb-6 sm:mb-7">
              Personal Finance, Reimagined
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Take control of your{" "}
              <span className="gradient-title">money</span> with clarity
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Track expenses, set budgets, monitor subscriptions, and get
              AI-powered insights — built for India, priced in rupees.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <Link href="/sign-in">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 text-base"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-2 shadow-2xl shadow-orange-500/10">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <span className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  app.wisewallet.in/dashboard
                </span>
              </div>
              <Image
                src="/banner.jpeg"
                width={1280}
                height={720}
                alt="WiseWallet Dashboard Preview"
                className="rounded-b-xl w-full object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden sm:block rounded-xl border bg-card px-4 py-3 shadow-lg">
              <p className="text-xs text-muted-foreground">Monthly Savings</p>
              <p className="text-lg font-bold text-emerald-600">+ ₹28,130</p>
            </div>
            <div className="absolute -top-3 -right-3 hidden sm:block rounded-xl border bg-card px-4 py-3 shadow-lg">
              <p className="text-xs text-muted-foreground">Health Score</p>
              <p className="text-lg font-bold text-orange-500">87 / 100</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
