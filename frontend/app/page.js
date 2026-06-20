import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  featuresData,
  howItWorksData,
  statsData,
  benefitsData,
} from "@/data/landing";
import HeroSection from "@/components/hero";
import { TestimonialsMarquee } from "@/components/testimonials-marquee";
import { FaqSection } from "@/components/faq-section";
import { LandingFooter } from "@/components/landing-footer";
import { Landing3DShowcase } from "@/components/landing-3d-showcase";

function SectionHeading({ badge, title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-14">
      {badge && (
        <Badge variant="section" className="mb-5 sm:mb-6">
          {badge}
        </Badge>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <Landing3DShowcase />

      {/* Stats */}
      <section className="py-20 border-b border-border/60 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {statsData.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-8 rounded-2xl border bg-card/60 backdrop-blur-sm hover:shadow-md transition-shadow"
              >
                <p className="text-3xl sm:text-5xl font-bold gradient-title mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="Features"
            title="Everything you need to manage money"
            subtitle="From daily expense tracking to AI-powered coaching — one platform for your entire financial picture."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group border-border/60 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300"
                >
                  <CardContent className="p-7 space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why WiseWallet */}
      <section className="py-28 bg-muted/20 border-y border-border/60">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="Why WiseWallet"
            title="Designed for clarity, built for results"
            subtitle="We focus on what actually helps you save more and stress less about money."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefitsData.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="p-6 rounded-2xl border bg-card/60 text-center hover:border-orange-500/20 transition-colors"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 mx-auto mb-5">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-28">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="How it works"
            title="Up and running in three steps"
            subtitle="No complicated setup. Create an account, add your transactions, and start making better decisions."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {howItWorksData.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative text-center">
                  <span className="text-6xl font-bold text-orange-500/40 dark:text-orange-400/35 mb-4 block">
                    {step.step}
                  </span>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 mx-auto mb-6">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* App highlights strip */}
      <section className="py-20 bg-gradient-to-r from-orange-500/5 via-background to-red-500/5 border-y border-border/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <Badge variant="section" className="mb-5 sm:mb-6">Dashboard</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
                Your entire financial picture, one screen
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Net worth, budget progress, health score, AI coach, and savings
                goals — everything you need without switching tabs.
              </p>
              <ul className="space-y-3">
                {[
                  "Real-time net worth across all accounts",
                  "Category budgets with visual progress bars",
                  "Financial health score out of 100",
                  "AI coach trained on your transactions",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10">
                      <Check className="h-3.5 w-3.5 text-orange-500" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Monthly Budget", value: "₹50,000", pct: "68%" },
                { label: "Subscriptions", value: "₹2,400/mo", pct: "4 active" },
                { label: "Savings Goal", value: "₹35,000", pct: "70% done" },
                { label: "This Month Net", value: "+ ₹28,130", pct: "Positive" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="p-5 rounded-2xl border bg-card/80 backdrop-blur-sm"
                >
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-xl font-bold mb-1">{card.value}</p>
                  <p className="text-xs text-orange-500">{card.pct}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials marquee */}
      <section id="testimonials" className="py-28 overflow-hidden">
        <div className="container mx-auto px-4 mb-14">
          <SectionHeading
            badge="Testimonials"
            title="Loved by users across India"
            subtitle="Real feedback from people who transformed how they manage money."
          />
        </div>
        <TestimonialsMarquee />
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="FAQ"
            title="Frequently asked questions"
            subtitle="Everything you need to know before getting started."
          />
          <FaqSection />
        </div>
      </section>

      {/* CTA */}
      <section className="py-28">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 px-8 py-20 sm:px-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_70%)]" />
            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
                Start managing your money smarter today
              </h2>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                Free to join. No credit card required. Set up your account in
                under 60 seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/sign-in">
                  <Button size="lg" className="h-12 px-10 text-base gap-2 w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-10 text-base w-full sm:w-auto"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
