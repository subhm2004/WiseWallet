import jwt from "jsonwebtoken";

export { SERVICE_PORTS } from "./ports.js";
export { getServiceUrls, resolveServiceUrl } from "./service-urls.js";

export function signToken(payload, secret, expiresIn = "7d") {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

export function authMiddleware(jwtSecret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = verifyToken(token, jwtSecret);
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

export function internalAuthMiddleware(internalSecret) {
  return (req, res, next) => {
    const key = req.headers["x-internal-key"];
    if (key !== internalSecret) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export function createService(name) {
  return {
    name,
    start(port, app) {
      const host = process.env.HOST || "0.0.0.0";
      app.listen(port, host, () => {
        console.log(`[${name}] running on http://${host}:${port}`);
      });
    },
  };
}

export {
  createGatewayArcjet,
  createUserRateLimitArcjet,
  createAiRateLimitArcjet,
  enforceArcjet,
  arcjetGatewayMiddleware,
  arcjetUserRateLimit,
} from "./arcjet.js";

export { CURRENCY_SYMBOL, formatMoney } from "./currency.js";
