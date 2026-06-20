import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";

/**
 * Gateway-level protection: SQL injection shield + bot detection
 */
export function createGatewayArcjet() {
  const key = process.env.ARCJET_KEY;
  if (!key) {
    console.warn("[arcjet] ARCJET_KEY not set — gateway protection disabled");
    return null;
  }

  return arcjet({
    key,
    rules: [
      shield({ mode: "LIVE" }),
      detectBot({
        mode: "LIVE",
        allow: [
          "CATEGORY:SEARCH_ENGINE",
          "GO_HTTP", // Inngest dev server
        ],
      }),
    ],
  });
}

/**
 * Per-user rate limiting for mutations (create account, transaction, etc.)
 * Default: 10 requests per hour per user
 */
export function createUserRateLimitArcjet(options = {}) {
  const key = process.env.ARCJET_KEY;
  if (!key) {
    console.warn("[arcjet] ARCJET_KEY not set — rate limiting disabled");
    return null;
  }

  return arcjet({
    key,
    characteristics: ["userId"],
    rules: [
      tokenBucket({
        mode: "LIVE",
        refillRate: options.refillRate ?? 10,
        interval: options.interval ?? 3600,
        capacity: options.capacity ?? 10,
      }),
    ],
  });
}

/**
 * Stricter rate limit for AI endpoints (receipt scan)
 * Default: 5 scans per hour per user
 */
export function createAiRateLimitArcjet() {
  return createUserRateLimitArcjet({
    refillRate: 5,
    interval: 3600,
    capacity: 5,
  });
}

export async function enforceArcjet(aj, req, res, extra = {}) {
  if (!aj) return true;

  try {
    const decision = await aj.protect(req, extra);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        res.status(429).json({
          error: "Too many requests. Please try again later.",
          remaining,
          resetInSeconds: reset,
        });
        return false;
      }
      res.status(403).json({ error: "Request blocked by security policy" });
      return false;
    }

    return true;
  } catch (error) {
    console.error("[arcjet] protect error:", error.message);
    return true; // fail open in dev if arcjet has issues
  }
}

const PUBLIC_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google",
  "/api/auth/google/callback",
];

export function arcjetGatewayMiddleware(aj) {
  return async (req, res, next) => {
    if (req.path === "/health") return next();
    // Inngest dev server + cloud need unblocked access to sync functions
    if (req.path.startsWith("/api/inngest")) return next();
    // Public auth routes — bot detection blocks password reset from browser/proxy
    if (PUBLIC_AUTH_PATHS.some((p) => req.path === p || req.path.startsWith(`${p}/`))) {
      return next();
    }

    const ok = await enforceArcjet(aj, req, res);
    if (ok) next();
  };
}

export function arcjetUserRateLimit(aj, requested = 1) {
  return async (req, res, next) => {
    if (!req.user?.userId) return next();

    const ok = await enforceArcjet(aj, req, res, {
      userId: req.user.userId,
      requested,
    });
    if (ok) next();
  };
}
