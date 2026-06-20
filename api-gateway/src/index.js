import "@wisewallet/shared/src/env.js";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import {
  SERVICE_PORTS,
  getServiceUrls,
  createService,
  createGatewayArcjet,
  arcjetGatewayMiddleware,
} from "@wisewallet/shared";

const app = express();
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
const extraOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const gatewayArcjet = createGatewayArcjet();
const PORT = Number(process.env.PORT) || SERVICE_PORTS.GATEWAY;
const services = getServiceUrls();

app.use(
  cors({
    origin: [WEB_URL, "http://localhost:3000", ...extraOrigins],
    credentials: true,
  })
);

// Do NOT use express.json() here — it consumes POST bodies before the proxy
// can forward them, breaking JSON mutations (create transaction, etc.).
// Multipart receipt uploads stream through untouched.

// ArcJet: shield + bot detection on all gateway routes
if (gatewayArcjet) {
  app.use(arcjetGatewayMiddleware(gatewayArcjet));
  console.log("[api-gateway] ArcJet shield + bot detection enabled");
}

// Health check for gateway + all services
app.get("/health", async (_req, res) => {
  const liteMode = process.env.LITE_MODE === "1";
  const checks = [
    { name: "auth", url: services.auth, required: true },
    { name: "account", url: services.account, required: true },
    { name: "transaction", url: services.transaction, required: true },
    { name: "budget", url: services.budget, required: true },
    {
      name: "notification",
      url: services.notification,
      required: !liteMode,
    },
    { name: "worker", url: services.worker, required: !liteMode },
  ];

  const status = await Promise.all(
    checks.map(async ({ name, url, required }) => {
      try {
        const r = await fetch(`${url}/health`);
        const data = await r.json();
        return { name, url, status: "ok", required, ...data };
      } catch {
        return { name, url, status: "down", required };
      }
    })
  );

  const coreOk = status
    .filter((s) => s.required)
    .every((s) => s.status === "ok");

  res.status(coreOk ? 200 : 503).json({
    gateway: coreOk ? "ok" : "degraded",
    liteMode,
    services: status,
  });
});

const proxyOptions = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite:
      typeof pathRewrite === "function"
        ? pathRewrite
        : pathRewrite,
    timeout: 120000,
    proxyTimeout: 120000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.headers.authorization) {
          proxyReq.setHeader("Authorization", req.headers.authorization);
        }
        if (req.headers["content-type"]) {
          proxyReq.setHeader("Content-Type", req.headers["content-type"]);
        }
      },
      error: (err, _req, res) => {
        console.error("[gateway] Proxy error:", err.message);
        if (res.writeHead) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Service unavailable" }));
        }
      },
    },
  });

// Auth Service - public routes
app.use(
  "/api/auth",
  proxyOptions(services.auth, {
    "^/api/auth": "",
  })
);

// Account Service - protected
app.use(
  "/api/accounts",
  proxyOptions(services.account, {
    "^/api/accounts": "",
  })
);

// Transaction Service - protected
app.use(
  "/api/transactions",
  proxyOptions(services.transaction, {
    "^/api/transactions": "",
  })
);

// Split expenses (transaction-service)
// Mount strips "/api/splits" — rewrite remainder to "/splits/..."
app.use(
  "/api/splits",
  proxyOptions(services.transaction, (path) => {
    const suffix = path === "/" ? "" : path;
    return `/splits${suffix}`;
  })
);

// Seed test data (transaction-service)
app.use(
  "/api/seed",
  proxyOptions(services.transaction, (path) => {
    const suffix = path === "/" ? "" : path;
    return `/seed${suffix}`;
  })
);

// Budget Service - protected
app.use(
  "/api/budgets",
  proxyOptions(services.budget, {
    "^/api/budgets": "",
  })
);

// Notification Service - email history + test send
app.use(
  "/api/notifications",
  proxyOptions(services.notification, {
    "^/api/notifications": "",
  })
);

// Inngest — worker service (background jobs & events)
app.use(
  "/api/inngest",
  createProxyMiddleware({
    target: services.worker,
    changeOrigin: true,
    pathRewrite: (path) => `/api/inngest${path === "/" ? "" : path}`,
    timeout: 120000,
    proxyTimeout: 120000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.headers.authorization) {
          proxyReq.setHeader("Authorization", req.headers.authorization);
        }
      },
      error: (err, _req, res) => {
        console.error("[gateway] Inngest proxy error:", err.message);
        if (res.writeHead) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Inngest service unavailable" }));
        }
      },
    },
  })
);

createService("api-gateway").start(PORT, app);
