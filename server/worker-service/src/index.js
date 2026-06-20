import "./load-env.js";
import express from "express";
import { serve } from "inngest/express";
import { SERVICE_PORTS, createService } from "@wisewallet/shared";
import { inngest } from "./inngest/client.js";
import { inngestFunctions } from "./inngest/functions.js";

const app = express();

app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ service: "worker-service", status: "ok", inngest: true });
});

// Inngest serve endpoint — Inngest Dev Server connects here
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: inngestFunctions,
  })
);

// Manual test trigger — fire any event from browser/curl during dev
app.post("/test/trigger", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }

  const { event, data } = req.body;
  if (!event) {
    return res.status(400).json({
      error: "event name required",
      examples: [
        { event: "transaction/recurring.process", data: { transactionId: "uuid", userId: "uuid" } },
        { event: "inngest/scheduled.timer", note: "Use Inngest dashboard to test cron functions" },
      ],
    });
  }

  const result = await inngest.send({ name: event, data: data || {} });
  res.json({ success: true, result });
});

createService("worker-service").start(SERVICE_PORTS.WORKER, app);
console.log("[worker-service] Inngest functions registered at /api/inngest");
