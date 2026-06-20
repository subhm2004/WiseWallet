import "./load-env.js";
import express from "express";
import cors from "cors";
import { db } from "@wisewallet/database";
import {
  SERVICE_PORTS,
  internalAuthMiddleware,
  authMiddleware,
  createService,
} from "@wisewallet/shared";
import { sendBrevoEmail } from "./brevo.js";

const app = express();
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const requireInternal = internalAuthMiddleware(INTERNAL_SECRET);
const requireAuth = authMiddleware(JWT_SECRET);

async function logEmail({ userId, to, subject, type, status, error, referenceId }) {
  try {
    return await db.emailLog.create({
      data: { userId, to, subject, type, status, error, referenceId },
    });
  } catch (err) {
    console.error("[notification-service] Failed to log email:", err.message);
    return null;
  }
}

async function sendAndLog({ to, subject, html, userId, type, toName, referenceId }) {
  const result = await sendBrevoEmail({ to, subject, html, toName });

  if (!result.success) {
    await logEmail({
      userId,
      to,
      subject,
      type: type || "general",
      status: "failed",
      error: result.error,
      referenceId,
    });
    console.error("[notification-service] Email failed →", to, result.error);
    throw new Error(result.error);
  }

  const log = await logEmail({
    userId,
    to,
    subject,
    type: type || "general",
    status: "sent",
    referenceId,
  });
  console.log(
    `[notification-service] Email sent via Brevo → ${to} | ${subject} | id: ${result.data?.messageId}`
  );
  return { success: true, data: result.data, log };
}

app.get("/health", (_req, res) => {
  res.json({ service: "notification-service", status: "ok", provider: "brevo" });
});

// Internal — called by worker-service (Inngest jobs)
app.post("/send", requireInternal, async (req, res) => {
  try {
    const { to, subject, html, userId, type, referenceId } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ error: "to, subject, and html are required" });
    }
    const result = await sendAndLog({ to, subject, html, userId, type, referenceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

// User's sent email history
app.get("/emails", requireAuth, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true },
    });

    const emails = await db.emailLog.findMany({
      where: {
        OR: [{ userId: req.user.userId }, { to: user?.email }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send test email to logged-in user
app.post("/test", requireAuth, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user?.email) {
      return res.status(400).json({ error: "User email not found" });
    }

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h1 style="color:#ef4444;">WiseWallet Test Email</h1>
        <p>Hello ${user.name || "there"},</p>
        <p>This is a test email from WiseWallet via Brevo. If you're reading this, your email setup is working!</p>
        <p style="color:#666;font-size:12px;">Sent at ${new Date().toLocaleString()}</p>
      </div>
    `;

    const result = await sendAndLog({
      to: user.email,
      subject: "WiseWallet — Test Email",
      html,
      userId: user.id,
      type: "test",
      toName: user.name,
    });

    res.json({ success: true, message: `Test email sent to ${user.email}`, log: result.log });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to send test email" });
  }
});

createService("notification-service").start(
  Number(process.env.PORT) || SERVICE_PORTS.NOTIFICATION,
  app
);
