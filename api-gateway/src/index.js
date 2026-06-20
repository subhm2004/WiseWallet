import "@wisewallet/shared/src/env.js";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import {
  SERVICE_PORTS,
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
  const services = [
    { name: "auth", port: SERVICE_PORTS.AUTH },
    { name: "account", port: SERVICE_PORTS.ACCOUNT },
    { name: "transaction", port: SERVICE_PORTS.TRANSACTION },
    { name: "budget", port: SERVICE_PORTS.BUDGET },
    { name: "notification", port: SERVICE_PORTS.NOTIFICATION },
    { name: "worker", port: SERVICE_PORTS.WORKER },
  ];

  const status = await Promise.all(
    services.map(async ({ name, port }) => {
      try {
        const r = await fetch(`http://localhost:${port}/health`);
        const data = await r.json();
        return { name, status: "ok", ...data };
      } catch {
        return { name, status: "down" };
      }
    })
  );

  res.json({ gateway: "ok", services: status });
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
  proxyOptions(`http://localhost:${SERVICE_PORTS.AUTH}`, {
    "^/api/auth": "",
  })
);

// Account Service - protected
app.use(
  "/api/accounts",
  proxyOptions(`http://localhost:${SERVICE_PORTS.ACCOUNT}`, {
    "^/api/accounts": "",
  })
);

// Transaction Service - protected
app.use(
  "/api/transactions",
  proxyOptions(`http://localhost:${SERVICE_PORTS.TRANSACTION}`, {
    "^/api/transactions": "",
  })
);

// Split expenses (transaction-service)
// Mount strips "/api/splits" — rewrite remainder to "/splits/..."
app.use(
  "/api/splits",
  proxyOptions(`http://localhost:${SERVICE_PORTS.TRANSACTION}`, (path) => {
    const suffix = path === "/" ? "" : path;
    return `/splits${suffix}`;
  })
);

// Seed test data (transaction-service)
app.use(
  "/api/seed",
  proxyOptions(`http://localhost:${SERVICE_PORTS.TRANSACTION}`, (path) => {
    const suffix = path === "/" ? "" : path;
    return `/seed${suffix}`;
  })
);

// Budget Service - protected
app.use(
  "/api/budgets",
  proxyOptions(`http://localhost:${SERVICE_PORTS.BUDGET}`, {
    "^/api/budgets": "",
  })
);

// Notification Service - email history + test send
app.use(
  "/api/notifications",
  proxyOptions(`http://localhost:${SERVICE_PORTS.NOTIFICATION}`, {
    "^/api/notifications": "",
  })
);

// Inngest — worker service (background jobs & events)
app.use(
  "/api/inngest",
  createProxyMiddleware({
    target: `http://localhost:${SERVICE_PORTS.WORKER}`,
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
