"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { testimonialsData } from "@/data/landing";

function TestimonialAvatar({ t }) {
  if (t.image) {
    return (
      <Image
        src={t.image}
        alt={t.name}
        width={44}
        height={44}
        className="h-11 w-11 rounded-full object-cover ring-2 ring-orange-500/20 shrink-0"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-semibold shrink-0">
      {t.initials}
    </div>
  );
}

function TestimonialCard({ t }) {
  return (
    <Card className="w-[340px] sm:w-[380px] shrink-0 border-border/60 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
          ))}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6 min-h-[72px]">
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <TestimonialAvatar t={t} />
          <div>
            <p className="font-semibold text-sm">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarqueeRow({ items }) {
  const doubled = [...items, ...items];

  return (
    <div className="flex gap-6 w-max animate-marquee-left">
      {doubled.map((t, i) => (
        <TestimonialCard key={`${t.name}-${i}`} t={t} />
      ))}
    </div>
  );
}

export function TestimonialsMarquee() {
  const row1 = testimonialsData;
  const row2 = [...testimonialsData].reverse();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="overflow-hidden">
          <MarqueeRow items={row1} />
        </div>
      </div>

      <div className="relative overflow-hidden hidden sm:block">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="overflow-hidden">
          <div className="flex gap-6 w-max animate-marquee-right">
            {[...row2, ...row2].map((t, i) => (
              <TestimonialCard key={`r2-${t.name}-${i}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
