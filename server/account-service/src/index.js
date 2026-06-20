import "@wisewallet/shared/src/env.js";
import express from "express";
import cors from "cors";
import { db, serializeDecimal } from "@wisewallet/database";
import {
  SERVICE_PORTS,
  authMiddleware,
  createService,
  createUserRateLimitArcjet,
  arcjetUserRateLimit,
} from "@wisewallet/shared";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const rateLimiter = createUserRateLimitArcjet();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const requireAuth = authMiddleware(JWT_SECRET);

function parseAccountId(raw) {
  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw;
}

async function findUserAccount(userId, accountId) {
  const id = parseAccountId(accountId);
  if (!id) return null;
  return db.account.findFirst({
    where: { id, userId },
  });
}

app.get("/health", (_req, res) => {
  res.json({ service: "account-service", status: "ok" });
});

// List all accounts for user
app.get("/", requireAuth, async (req, res) => {
  try {
    const accounts = await db.account.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { transactions: true } } },
    });
    res.json(accounts.map(serializeDecimal));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create account (rate limited: 10/hour per user)
app.post("/", requireAuth, arcjetUserRateLimit(rateLimiter), async (req, res) => {
  try {
    const { name, type, balance, isDefault } = req.body;
    const balanceFloat = parseFloat(balance);
    if (isNaN(balanceFloat)) {
      return res.status(400).json({ error: "Invalid balance amount" });
    }

    const existingAccounts = await db.account.findMany({
      where: { userId: req.user.userId },
    });

    const shouldBeDefault =
      existingAccounts.length === 0 ? true : Boolean(isDefault);

    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: req.user.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        name,
        type,
        balance: balanceFloat,
        userId: req.user.userId,
        isDefault: shouldBeDefault,
      },
    });

    res.status(201).json(serializeDecimal(account));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account with transactions
app.get("/:id", requireAuth, async (req, res) => {
  try {
    const account = await findUserAccount(req.user.userId, req.params.id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const full = await db.account.findUnique({
      where: { id: account.id },
      include: {
        transactions: { orderBy: { date: "desc" } },
        _count: { select: { transactions: true } },
      },
    });

    res.json({
      ...serializeDecimal(full),
      transactions: full.transactions.map(serializeDecimal),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set default account
app.patch("/:id/default", requireAuth, async (req, res) => {
  try {
    const account = await findUserAccount(req.user.userId, req.params.id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    await db.account.updateMany({
      where: { userId: req.user.userId, isDefault: true },
      data: { isDefault: false },
    });

    const updated = await db.account.update({
      where: { id: account.id },
      data: { isDefault: true },
    });

    res.json(serializeDecimal(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update account (name, type, balance, isDefault)
app.patch("/:id", requireAuth, async (req, res) => {
  try {
    const account = await findUserAccount(req.user.userId, req.params.id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const { name, type, balance, isDefault } = req.body || {};
    const data = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ error: "Account name is required" });
      }
      data.name = trimmed;
    }

    if (type !== undefined) {
      if (!["CURRENT", "SAVINGS"].includes(type)) {
        return res.status(400).json({ error: "Invalid account type" });
      }
      data.type = type;
    }

    if (balance !== undefined) {
      const balanceFloat = parseFloat(balance);
      if (isNaN(balanceFloat)) {
        return res.status(400).json({ error: "Invalid balance amount" });
      }
      data.balance = balanceFloat;
    }

    if (isDefault === true) {
      await db.account.updateMany({
        where: { userId: req.user.userId, isDefault: true },
        data: { isDefault: false },
      });
      data.isDefault = true;
    }

    const updated = await db.account.update({
      where: { id: account.id },
      data,
    });

    res.json(serializeDecimal(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account (transactions cascade)
app.delete("/:id", requireAuth, async (req, res) => {
  try {
    const account = await findUserAccount(req.user.userId, req.params.id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const accountWithCount = await db.account.findUnique({
      where: { id: account.id },
      include: { _count: { select: { transactions: true } } },
    });

    const allAccounts = await db.account.findMany({
      where: { userId: req.user.userId },
    });

    if (allAccounts.length <= 1) {
      return res.status(400).json({ error: "You must keep at least one account" });
    }

    const { migrateToAccountId, migrateToAccountName } = req.body || {};

    let targetAccount = null;
    if (migrateToAccountId) {
      targetAccount = await findUserAccount(req.user.userId, migrateToAccountId);
    } else if (migrateToAccountName?.trim()) {
      targetAccount = await db.account.findFirst({
        where: {
          userId: req.user.userId,
          name: { equals: migrateToAccountName.trim(), mode: "insensitive" },
        },
      });
    }

    if (accountWithCount._count.transactions > 0) {
      if (migrateToAccountId && !targetAccount) {
        return res.status(400).json({ error: "Target account not found" });
      }
      if (migrateToAccountName?.trim() && !targetAccount) {
        return res.status(400).json({ error: `No account named "${migrateToAccountName.trim()}"` });
      }
      if (!targetAccount) {
        return res.status(400).json({
          error: "This account has transactions. Select another account to move them to.",
          transactionCount: accountWithCount._count.transactions,
        });
      }
      if (targetAccount.id === account.id) {
        return res.status(400).json({ error: "Cannot migrate to the same account" });
      }
      await db.transaction.updateMany({
        where: { accountId: account.id },
        data: { accountId: targetAccount.id },
      });
    }

    await db.account.delete({ where: { id: account.id } });

    if (account.isDefault) {
      const remaining = await db.account.findFirst({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "asc" },
      });
      if (remaining) {
        await db.account.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

createService("account-service").start(SERVICE_PORTS.ACCOUNT, app);
