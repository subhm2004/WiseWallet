import { cn } from "@/lib/utils";

const WALLET_ORANGE = "#f97316";

function LogoMark({ size = 44, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Speed lines */}
      <rect x="2" y="9" width="14" height="4.5" rx="2.25" fill={WALLET_ORANGE} />
      <rect x="2" y="20" width="21" height="4.5" rx="2.25" fill={WALLET_ORANGE} />
      <rect x="2" y="31" width="12" height="4.5" rx="2.25" fill={WALLET_ORANGE} />
      {/* Wallet body */}
      <path
        d="M24 11.5h33.5c2.75 0 5 2.25 5 5v19.5c0 2.75-2.25 5-5 5H26c-2.75 0-5-2.25-5-5V16.5c0-2.75 2.25-5 5-5z"
        fill={WALLET_ORANGE}
      />
      {/* Top fold */}
      <path
        d="M22 18.5h42.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Clasp */}
      <rect x="49" y="24" width="9.5" height="7.5" rx="1.75" fill="white" />
      <circle cx="53.75" cy="27.75" r="1.85" fill={WALLET_ORANGE} />
    </svg>
  );
}

const SIZE_MAP = {
  sm: { mark: 36, text: "text-lg", gap: "gap-2.5" },
  md: { mark: 44, text: "text-xl", gap: "gap-3" },
  lg: { mark: 52, text: "text-2xl", gap: "gap-3.5" },
};

export function Logo({
  showText = true,
  size = "md",
  className,
  textClassName,
}) {
  const config = SIZE_MAP[size] || SIZE_MAP.md;

  if (!showText) {
    return <LogoMark size={config.mark} className={className} />;
  }

  return (
    <div
      suppressHydrationWarning
      className={cn("inline-flex items-center", config.gap, className)}
    >
      <LogoMark size={config.mark} />
      <span
        className={cn(
          "inline-flex items-baseline whitespace-nowrap font-bold tracking-tight leading-none select-none",
          config.text,
          textClassName
        )}
      >
        <span className="text-orange-500">Wise</span>
        <span className="text-foreground">Wallet</span>
      </span>
    </div>
  );
}

export { LogoMark };
