import "@wisewallet/shared/src/env.js";
import express from "express";
import cors from "cors";
import { db, serializeDecimal } from "@wisewallet/database";
import {
  SERVICE_PORTS,
  authMiddleware,
  createService,
} from "@wisewallet/shared";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const requireAuth = authMiddleware(JWT_SECRET);

function monthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
}

app.get("/health", (_req, res) => {
  res.json({ service: "budget-service", status: "ok" });
});

// ── Category budgets ──
app.get("/categories", requireAuth, async (req, res) => {
  try {
    const { start, end } = monthRange();
    const [budgets, expenses] = await Promise.all([
      db.categoryBudget.findMany({ where: { userId: req.user.userId } }),
      db.transaction.findMany({
        where: {
          userId: req.user.userId,
          type: "EXPENSE",
          date: { gte: start, lte: end },
        },
      }),
    ]);

    const spentByCategory = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount.toNumber();
      return acc;
    }, {});

    const items = budgets.map((b) => {
      const amount = b.amount.toNumber();
      const spent = spentByCategory[b.category] || 0;
      return {
        ...serializeDecimal(b),
        spent: Math.round(spent * 100) / 100,
        percentUsed: amount > 0 ? Math.round((spent / amount) * 1000) / 10 : 0,
        remaining: Math.round((amount - spent) * 100) / 100,
      };
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/categories", requireAuth, async (req, res) => {
  try {
    const { category, amount: rawAmount } = req.body;
    const amount = parseFloat(rawAmount);

    if (!category || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "category and valid amount required" });
    }

    const budget = await db.categoryBudget.upsert({
      where: { userId_category: { userId: req.user.userId, category } },
      update: { amount },
      create: { userId: req.user.userId, category, amount },
    });

    res.json(serializeDecimal(budget));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/categories/:category", requireAuth, async (req, res) => {
  try {
    await db.categoryBudget.deleteMany({
      where: { userId: req.user.userId, category: req.params.category },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Savings goals ──
app.get("/goals", requireAuth, async (req, res) => {
  try {
    const goals = await db.savingsGoal.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      goals.map((g) => {
        const target = g.targetAmount.toNumber();
        const saved = g.savedAmount.toNumber();
        return {
          ...serializeDecimal(g),
          percentComplete: target > 0 ? Math.min(100, Math.round((saved / target) * 1000) / 10) : 0,
        };
      })
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/goals", requireAuth, async (req, res) => {
  try {
    const { name, targetAmount: rawTarget, savedAmount: rawSaved, deadline } = req.body;
    const targetAmount = parseFloat(rawTarget);
    const savedAmount = rawSaved != null ? parseFloat(rawSaved) : 0;

    if (!name?.trim() || isNaN(targetAmount) || targetAmount <= 0) {
      return res.status(400).json({ error: "name and valid targetAmount required" });
    }

    const goal = await db.savingsGoal.create({
      data: {
        userId: req.user.userId,
        name: name.trim(),
        targetAmount,
        savedAmount: isNaN(savedAmount) ? 0 : Math.max(0, savedAmount),
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    res.status(201).json(serializeDecimal(goal));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/goals/:id", requireAuth, async (req, res) => {
  try {
    const existing = await db.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!existing) return res.status(404).json({ error: "Goal not found" });

    const data = {};
    if (req.body.name != null) data.name = req.body.name.trim();
    if (req.body.targetAmount != null) {
      const target = parseFloat(req.body.targetAmount);
      if (isNaN(target) || target <= 0) {
        return res.status(400).json({ error: "Invalid targetAmount" });
      }
      data.targetAmount = target;
    }
    if (req.body.savedAmount != null) {
      const saved = parseFloat(req.body.savedAmount);
      if (isNaN(saved) || saved < 0) {
        return res.status(400).json({ error: "Invalid savedAmount" });
      }
      data.savedAmount = saved;
    }
    if (req.body.deadline !== undefined) {
      data.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    }

    const goal = await db.savingsGoal.update({
      where: { id: req.params.id },
      data,
    });

    res.json(serializeDecimal(goal));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/goals/:id", requireAuth, async (req, res) => {
  try {
    const existing = await db.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!existing) return res.status(404).json({ error: "Goal not found" });

    await db.savingsGoal.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current budget + expenses for account
app.get("/", requireAuth, async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) {
      return res.status(400).json({ error: "Please select a bank account" });
    }

    const budget = await db.budget.findFirst({
      where: { userId: req.user.userId },
    });

    const { start, end } = monthRange();

    const expenses = await db.transaction.aggregate({
      where: {
        userId: req.user.userId,
        accountId,
        type: "EXPENSE",
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    res.json({
      budget: budget ? serializeDecimal(budget) : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update budget
app.put("/", requireAuth, async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const budget = await db.budget.upsert({
      where: { userId: req.user.userId },
      update: { amount },
      create: { userId: req.user.userId, amount },
    });

    res.json(serializeDecimal(budget));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

createService("budget-service").start(SERVICE_PORTS.BUDGET, app);
