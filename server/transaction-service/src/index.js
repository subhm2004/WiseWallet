import "@wisewallet/shared/src/env.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import Groq from "groq-sdk";
import { db, serializeDecimal } from "@wisewallet/database";
import {
  SERVICE_PORTS,
  authMiddleware,
  createService,
  createUserRateLimitArcjet,
  createAiRateLimitArcjet,
  arcjetUserRateLimit,
} from "@wisewallet/shared";
import { seedUserData } from "./seed.js";
import { scanReceiptImage } from "./receipt-scan.js";
import { getMonthlyAnalytics, getOverview, transactionsToCsv, getNetWorthTimeline } from "./analytics.js";
import { applyCategoryRules, listCategoryRules } from "./category-rules.js";
import {
  getHealthScore,
  getCategoryBreakdown,
  getSubscriptions,
} from "./health-score.js";
import { askFinanceCoach, generateMonthlyInsights } from "./insights.js";
import { generateMonthlyPdf } from "./pdf-export.js";
import { createSplitsRouter, serializeGroupPublic, getPublicSplitGroup } from "./splits.js";
import { parseBankCsv, importCsvRows } from "./csv-import.js";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const mutationRateLimiter = createUserRateLimitArcjet();
const aiRateLimiter = createAiRateLimitArcjet();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const requireAuth = authMiddleware(JWT_SECRET);

function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);
  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
}

app.get("/health", (_req, res) => {
  res.json({ service: "transaction-service", status: "ok" });
});

// ── Seed test data (must be before /:id routes) ──
app.post("/seed", requireAuth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
      return res.status(403).json({ error: "Seed disabled in production" });
    }
    const result = await seedUserData(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error("[transaction-service] Seed error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── Receipt scan (must be before /:id routes) ──
app.post(
  "/scan-receipt",
  requireAuth,
  arcjetUserRateLimit(aiRateLimiter),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "Groq API key not configured" });
      }

      const result = await scanReceiptImage(
        groq,
        req.file.buffer,
        req.file.mimetype
      );

      if (!result) {
        return res.status(422).json({
          error: "Could not read receipt. Upload a clear receipt photo.",
        });
      }

      const desc = result.description || result.merchantName || "";
      result.category = await applyCategoryRules(
        req.user.userId,
        desc,
        result.category
      );

      res.json(result);
    } catch (error) {
      console.error("[transaction-service] Receipt scan error:", error.message);
      res.status(500).json({
        error: error.message || "Failed to scan receipt. Try a clearer image.",
      });
    }
  }
);

// ── Analytics & insights (before /:id routes) ──
app.get("/analytics/monthly", requireAuth, async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months, 10) || 6, 12);
    const data = await getMonthlyAnalytics(req.user.userId, months);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/overview", requireAuth, async (req, res) => {
  try {
    const data = await getOverview(req.user.userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/net-worth-timeline", requireAuth, async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months, 10) || 6, 12);
    const data = await getNetWorthTimeline(req.user.userId, months);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Category auto-rules
app.get("/rules/categories", requireAuth, async (req, res) => {
  try {
    const rules = await listCategoryRules(req.user.userId);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/rules/categories", requireAuth, async (req, res) => {
  try {
    const { pattern, category } = req.body || {};
    const trimmed = pattern?.trim();
    if (!trimmed || !category?.trim()) {
      return res.status(400).json({ error: "Pattern and category are required" });
    }
    const rule = await db.categoryRule.upsert({
      where: {
        userId_pattern: { userId: req.user.userId, pattern: trimmed },
      },
      update: { category: category.trim() },
      create: {
        userId: req.user.userId,
        pattern: trimmed,
        category: category.trim(),
      },
    });
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/rules/categories/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await db.categoryRule.deleteMany({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!deleted.count) {
      return res.status(404).json({ error: "Rule not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public split view (no auth)
app.get("/splits/public/:token", async (req, res) => {
  try {
    const group = await getPublicSplitGroup(req.params.token);
    if (!group) {
      return res.status(404).json({ error: "Split group not found" });
    }
    res.json({ group: serializeGroupPublic(group) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/health-score", requireAuth, async (req, res) => {
  try {
    const data = await getHealthScore(req.user.userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/categories", requireAuth, async (req, res) => {
  try {
    const data = await getCategoryBreakdown(req.user.userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/subscriptions", requireAuth, async (req, res) => {
  try {
    const data = await getSubscriptions(req.user.userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/insights/monthly", requireAuth, async (req, res) => {
  try {
    const insights = await generateMonthlyInsights(groq, req.user.userId);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/insights/ask",
  requireAuth,
  arcjetUserRateLimit(aiRateLimiter),
  async (req, res) => {
    try {
      const { question } = req.body || {};
      const result = await askFinanceCoach(groq, req.user.userId, question);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.get("/export/csv", requireAuth, async (req, res) => {
  try {
    const transactions = await db.transaction.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: "desc" },
      include: { account: true },
    });
    const csv = transactionsToCsv(transactions);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="wisewallet-transactions.csv"'
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/export/pdf", requireAuth, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true },
    });
    const pdf = await generateMonthlyPdf(req.user.userId, user?.name);
    const month = new Date().toISOString().slice(0, 7);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="wisewallet-report-${month}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("[transaction-service] PDF export error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── CSV bank import ──
app.post("/import/csv/preview", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "CSV file is required" });
    }
    const format = req.body?.format || "auto";
    const text = req.file.buffer.toString("utf-8");
    const result = parseBankCsv(text, format);
    res.json({
      format: result.format,
      preview: result.rows.slice(0, 20),
      totalRows: result.rows.length,
      errors: result.errors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/import/csv", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "CSV file is required" });
    }
    const { accountId, format, skipDuplicates, applyRules } = req.body || {};
    if (!accountId) {
      return res.status(400).json({ error: "Please select a bank account" });
    }
    const text = req.file.buffer.toString("utf-8");
    const parsed = parseBankCsv(text, format || "auto");
    if (parsed.rows.length === 0) {
      return res.status(400).json({
        error: "No valid transactions found in CSV",
        errors: parsed.errors,
      });
    }
    const result = await importCsvRows(db, req.user.userId, accountId, parsed.rows, {
      skipDuplicates: skipDuplicates !== "false",
      applyRules: applyRules !== "false",
    });
    res.json({
      ...result,
      format: parsed.format,
      totalParsed: parsed.rows.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Recurring bills CRUD ──
app.get("/recurring", requireAuth, async (req, res) => {
  try {
    const data = await getSubscriptions(req.user.userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/recurring", requireAuth, async (req, res) => {
  try {
    const { accountId, description, amount, category, recurringInterval, nextDueDate } =
      req.body || {};
    if (!accountId) {
      return res.status(400).json({ error: "Please select a bank account" });
    }
    const account = await db.account.findFirst({
      where: { id: accountId, userId: req.user.userId },
    });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const parsedAmount = parseFloat(amount);
    if (!description?.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Description and valid amount required" });
    }
    if (!recurringInterval) {
      return res.status(400).json({ error: "Recurring interval required" });
    }

    const dueBase = nextDueDate ? new Date(nextDueDate) : new Date();
    const nextRecurringDate = nextDueDate
      ? new Date(nextDueDate)
      : calculateNextRecurringDate(dueBase, recurringInterval);

    const categoryResolved = await applyCategoryRules(
      req.user.userId,
      description,
      category || "other"
    );

    const transaction = await db.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: parsedAmount,
          description: description.trim(),
          date: dueBase,
          category: categoryResolved,
          accountId,
          userId: req.user.userId,
          isRecurring: true,
          recurringInterval,
          nextRecurringDate,
        },
      });
      return created;
    });

    res.status(201).json(serializeDecimal(transaction));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/recurring/:id", requireAuth, async (req, res) => {
  try {
    const existing = await db.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.userId, isRecurring: true },
    });
    if (!existing) return res.status(404).json({ error: "Recurring bill not found" });

    const { description, amount, category, recurringInterval, nextDueDate, accountId } =
      req.body || {};
    const data = {};
    if (description != null) data.description = description.trim();
    if (category != null) data.category = category;
    if (recurringInterval != null) data.recurringInterval = recurringInterval;
    if (nextDueDate != null) data.nextRecurringDate = new Date(nextDueDate);

    let balanceDelta = 0;
    if (amount != null) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      balanceDelta = existing.amount.toNumber() - parsedAmount;
      data.amount = parsedAmount;
    }
    if (accountId != null) data.accountId = accountId;

    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: existing.id },
        data,
      });
      if (balanceDelta !== 0) {
        await tx.account.update({
          where: { id: updated.accountId },
          data: { balance: { increment: balanceDelta } },
        });
      }
      return updated;
    });

    res.json(serializeDecimal(transaction));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/recurring/:id", requireAuth, async (req, res) => {
  try {
    const existing = await db.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.userId, isRecurring: true },
    });
    if (!existing) return res.status(404).json({ error: "Recurring bill not found" });

    await db.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: existing.id },
        data: { isRecurring: false, recurringInterval: null, nextRecurringDate: null },
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Split expenses (before /:id routes)
app.use("/splits", createSplitsRouter(requireAuth));

// List transactions (with optional filters)
app.get("/", requireAuth, async (req, res) => {
  try {
    const where = { userId: req.user.userId };
    if (req.query.accountId) where.accountId = req.query.accountId;
    if (req.query.category) where.category = req.query.category;
    if (req.query.type) where.type = req.query.type;
    if (req.query.search) {
      where.description = { contains: req.query.search, mode: "insensitive" };
    }
    if (req.query.dateFrom || req.query.dateTo) {
      where.date = {};
      if (req.query.dateFrom) where.date.gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const end = new Date(req.query.dateTo);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }
    if (req.query.minAmount || req.query.maxAmount) {
      where.amount = {};
      if (req.query.minAmount) where.amount.gte = parseFloat(req.query.minAmount);
      if (req.query.maxAmount) where.amount.lte = parseFloat(req.query.maxAmount);
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { account: true },
      take: Math.min(parseInt(req.query.limit, 10) || 200, 500),
    });
    res.json(transactions.map(serializeDecimal));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
app.post("/", requireAuth, arcjetUserRateLimit(mutationRateLimiter), async (req, res) => {
  try {
    const data = req.body;
    if (!data?.accountId) {
      return res.status(400).json({ error: "Please select a bank account" });
    }
    const account = await db.account.findFirst({
      where: { id: data.accountId, userId: req.user.userId },
    });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const amount = parseFloat(data.amount);
    const balanceChange = data.type === "EXPENSE" ? -amount : amount;
    const newBalance = account.balance.toNumber() + balanceChange;
    const category = await applyCategoryRules(
      req.user.userId,
      data.description,
      data.category
    );

    const transaction = await db.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          type: data.type,
          amount,
          description: data.description,
          date: new Date(data.date),
          category,
          accountId: data.accountId,
          userId: req.user.userId,
          isRecurring: data.isRecurring || false,
          recurringInterval: data.recurringInterval || null,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });
      return created;
    });

    res.status(201).json(serializeDecimal(transaction));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete (before /:id)
app.delete("/bulk", requireAuth, async (req, res) => {
  try {
    const { transactionIds } = req.body;
    const transactions = await db.transaction.findMany({
      where: { id: { in: transactionIds }, userId: req.user.userId },
    });

    const balanceChanges = transactions.reduce((acc, t) => {
      const change = t.type === "EXPENSE" ? t.amount : t.amount.negated();
      acc[t.accountId] = (acc[t.accountId] || 0) + change.toNumber();
      return acc;
    }, {});

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { id: { in: transactionIds }, userId: req.user.userId },
      });
      for (const [accountId, change] of Object.entries(balanceChanges)) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: change } },
        });
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete single transaction
app.delete("/:id", requireAuth, async (req, res) => {
  try {
    const transaction = await db.transaction.findUnique({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const balanceChange =
      transaction.type === "EXPENSE"
        ? transaction.amount.toNumber()
        : -transaction.amount.toNumber();

    await db.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: { id: transaction.id },
      });
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single transaction
app.get("/:id", requireAuth, async (req, res) => {
  try {
    const transaction = await db.transaction.findUnique({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(serializeDecimal(transaction));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
app.put("/:id", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const original = await db.transaction.findUnique({
      where: { id: req.params.id, userId: req.user.userId },
      include: { account: true },
    });
    if (!original) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const amount = parseFloat(data.amount);
    const oldChange =
      original.type === "EXPENSE"
        ? -original.amount.toNumber()
        : original.amount.toNumber();
    const newChange = data.type === "EXPENSE" ? -amount : amount;
    const netChange = newChange - oldChange;
    const category = await applyCategoryRules(
      req.user.userId,
      data.description,
      data.category
    );

    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: req.params.id, userId: req.user.userId },
        data: {
          type: data.type,
          amount,
          description: data.description,
          date: new Date(data.date),
          category,
          accountId: data.accountId,
          isRecurring: data.isRecurring || false,
          recurringInterval: data.recurringInterval || null,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: netChange } },
      });
      return updated;
    });

    res.json(serializeDecimal(transaction));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

createService("transaction-service").start(
  Number(process.env.PORT) || SERVICE_PORTS.TRANSACTION,
  app
);
