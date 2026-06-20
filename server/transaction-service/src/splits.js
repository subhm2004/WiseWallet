import { Router } from "express";
import { db, serializeDecimal } from "@wisewallet/database";

const GROUP_INCLUDE = {
  members: true,
  expenses: { include: { shares: true, payer: true } },
  settlements: { include: { fromMember: true, toMember: true } },
};

export function computeSettlements(group) {
  const members = group.members ?? [];
  const expenses = group.expenses ?? [];
  const payments = group.settlements ?? [];
  const balances = {};
  for (const m of members) {
    balances[m.id] = { id: m.id, name: m.name, balance: 0 };
  }

  for (const exp of expenses) {
    const amount = Number(exp.amount);
    if (!balances[exp.payerId]) continue;
    balances[exp.payerId].balance += amount;
    for (const share of exp.shares ?? []) {
      if (balances[share.memberId]) {
        balances[share.memberId].balance -= Number(share.amount);
      }
    }
  }

  // Recorded settlements reduce debt / credit
  for (const pay of payments) {
    const amount = Number(pay.amount);
    if (balances[pay.fromMemberId]) {
      balances[pay.fromMemberId].balance += amount;
    }
    if (balances[pay.toMemberId]) {
      balances[pay.toMemberId].balance -= amount;
    }
  }

  const creditors = [];
  const debtors = [];
  for (const b of Object.values(balances)) {
    const rounded = Math.round(b.balance * 100) / 100;
    if (rounded > 0.01) creditors.push({ ...b, amount: rounded });
    else if (rounded < -0.01) debtors.push({ ...b, amount: -rounded });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;
  const d = debtors.map((x) => ({ ...x }));
  const c = creditors.map((x) => ({ ...x }));

  while (i < d.length && j < c.length) {
    const pay = Math.min(d[i].amount, c[j].amount);
    settlements.push({
      from: d[i].name,
      to: c[j].name,
      amount: Math.round(pay * 100) / 100,
    });
    d[i].amount -= pay;
    c[j].amount -= pay;
    if (d[i].amount < 0.01) i++;
    if (c[j].amount < 0.01) j++;
  }

  return {
    balances: Object.values(balances).map((b) => ({
      id: b.id,
      name: b.name,
      net: Math.round(b.balance * 100) / 100,
    })),
    settlements,
  };
}

function serializeGroup(group, { role = "owner", memberId = null } = {}) {
  const members = group.members ?? [];
  const expenses = group.expenses ?? [];
  const recorded = group.settlements ?? [];
  const { balances, settlements } = computeSettlements({
    members,
    expenses,
    settlements: recorded,
  });
  return {
    id: group.id,
    title: group.title,
    inviteToken: group.inviteToken,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    role,
    myMemberId: memberId,
    isOwner: role === "owner",
    members,
    expenses: expenses.map((e) => ({
      ...serializeDecimal(e),
      shares: (e.shares ?? []).map(serializeDecimal),
    })),
    settlements: (group.settlements ?? []).map((s) => ({
      ...serializeDecimal(s),
      fromName: s.fromMember?.name,
      toName: s.toMember?.name,
    })),
    balances,
    settlementsSuggested: settlements,
  };
}

async function findAccessibleGroup(userId, groupId) {
  const group = await db.splitGroup.findUnique({
    where: { id: groupId },
    include: GROUP_INCLUDE,
  });
  if (!group) return null;

  if (group.userId === userId) {
    return { group, role: "owner", memberId: null };
  }

  const linked = group.members.find((m) => m.userId === userId);
  if (linked) {
    return { group, role: "member", memberId: linked.id };
  }

  return null;
}

async function findGroupsForUser(userId) {
  const owned = await db.splitGroup.findMany({
    where: { userId },
    include: GROUP_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });

  const memberOf = await db.splitGroup.findMany({
    where: {
      userId: { not: userId },
      members: { some: { userId } },
    },
    include: GROUP_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });

  const ownedIds = new Set(owned.map((g) => g.id));
  const joined = memberOf.filter((g) => !ownedIds.has(g.id));

  return [
    ...owned.map((g) => ({ group: g, role: "owner", memberId: null })),
    ...joined.map((g) => {
      const member = g.members.find((m) => m.userId === userId);
      return { group: g, role: "member", memberId: member?.id ?? null };
    }),
  ];
}

export async function getPublicSplitGroup(token) {
  return db.splitGroup.findFirst({
    where: { inviteToken: token },
    include: GROUP_INCLUDE,
  });
}

export function serializeGroupPublic(group) {
  const data = serializeGroup(group);
  return {
    title: data.title,
    members: data.members.map((m) => ({
      id: m.id,
      name: m.name,
      claimed: !!m.userId,
    })),
    expenses: data.expenses.map((e) => ({
      description: e.description,
      amount: e.amount,
      payerName: e.payer?.name || "—",
    })),
    settlements: data.settlementsSuggested,
  };
}

async function resolveSplitMember(db, raw) {
  const value = String(raw || "").trim();
  if (!value) return null;

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (!isEmail) {
    return { name: value, userId: null };
  }

  const email = value.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    return {
      name: user.name || email.split("@")[0],
      userId: user.id,
    };
  }

  return { name: email.split("@")[0], userId: null };
}

export function createSplitsRouter(requireAuth) {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
    try {
      const entries = await findGroupsForUser(req.user.userId);
      res.json({
        groups: entries.map(({ group, role, memberId }) =>
          serializeGroup(group, { role, memberId })
        ),
      });
    } catch (error) {
      if (error.code === "P2021") {
        return res.status(503).json({
          error: "Split expenses tables missing. Run: npm run db:push",
          groups: [],
        });
      }
      res.status(500).json({ error: error.message, groups: [] });
    }
  });

  router.post("/", requireAuth, async (req, res) => {
    try {
      const { title, members = [] } = req.body || {};
      if (!title?.trim()) {
        return res.status(400).json({ error: "Group name is required" });
      }

      const owner = await db.user.findUnique({ where: { id: req.user.userId } });
      const ownerName =
        owner?.name?.trim() ||
        owner?.email?.split("@")[0] ||
        "You";

      const memberRows = [];
      const seen = new Set();

      for (const m of Array.isArray(members) ? members : []) {
        const resolved = await resolveSplitMember(db, m);
        if (!resolved) continue;
        const key = resolved.userId || resolved.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        memberRows.push(resolved);
      }

      if (!memberRows.some((m) => m.userId === req.user.userId)) {
        memberRows.unshift({ name: ownerName, userId: req.user.userId });
      }

      const group = await db.splitGroup.create({
        data: {
          userId: req.user.userId,
          title: title.trim(),
          members: {
            create: memberRows,
          },
        },
        include: GROUP_INCLUDE,
      });

      res.status(201).json({ group: serializeGroup(group, { role: "owner" }) });
    } catch (error) {
      if (error.code === "P2021") {
        return res.status(503).json({
          error: "Split expenses tables missing. Run: npm run db:push",
        });
      }
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/join/:token", requireAuth, async (req, res) => {
    try {
      const group = await db.splitGroup.findFirst({
        where: { inviteToken: req.params.token },
        include: GROUP_INCLUDE,
      });
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const userId = req.user.userId;
      if (group.userId === userId) {
        return res.json({
          group: serializeGroup(group, { role: "owner" }),
          alreadyJoined: true,
        });
      }

      const existing = group.members.find((m) => m.userId === userId);
      if (existing) {
        return res.json({
          group: serializeGroup(group, { role: "member", memberId: existing.id }),
          alreadyJoined: true,
        });
      }

      const { memberId, memberName } = req.body || {};
      let member = null;

      if (memberId) {
        member = group.members.find((m) => m.id === memberId && !m.userId);
        if (!member) {
          return res.status(400).json({ error: "Invalid member slot" });
        }
        await db.splitMember.update({
          where: { id: member.id },
          data: { userId },
        });
      } else {
        const name =
          memberName?.trim() ||
          req.user.name?.trim() ||
          req.user.email?.split("@")[0] ||
          "Member";
        member = await db.splitMember.create({
          data: { groupId: group.id, name, userId },
        });
      }

      const updated = await db.splitGroup.findUnique({
        where: { id: group.id },
        include: GROUP_INCLUDE,
      });

      res.status(201).json({
        group: serializeGroup(updated, { role: "member", memberId: member.id }),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:id", requireAuth, async (req, res) => {
    try {
      const access = await findAccessibleGroup(req.user.userId, req.params.id);
      if (!access) return res.status(404).json({ error: "Group not found" });
      res.json(
        serializeGroup(access.group, {
          role: access.role,
          memberId: access.memberId,
        })
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      const group = await db.splitGroup.findFirst({
        where: { id: req.params.id, userId: req.user.userId },
      });
      if (!group) return res.status(404).json({ error: "Group not found" });
      await db.splitGroup.delete({ where: { id: group.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:id/members", requireAuth, async (req, res) => {
    try {
      const group = await db.splitGroup.findFirst({
        where: { id: req.params.id, userId: req.user.userId },
      });
      if (!group) return res.status(404).json({ error: "Group not found" });

      const { name, email } = req.body || {};
      const raw = email?.trim() || name?.trim();
      if (!raw) {
        return res.status(400).json({ error: "Member name or email is required" });
      }

      const resolved = await resolveSplitMember(db, email?.trim() || name?.trim());
      if (!resolved) {
        return res.status(400).json({ error: "Invalid member" });
      }

      await db.splitMember.create({
        data: { groupId: group.id, name: resolved.name, userId: resolved.userId },
      });

      const updated = await db.splitGroup.findUnique({
        where: { id: group.id },
        include: GROUP_INCLUDE,
      });
      res.status(201).json(serializeGroup(updated, { role: "owner" }));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:id/expenses", requireAuth, async (req, res) => {
    try {
      const access = await findAccessibleGroup(req.user.userId, req.params.id);
      if (!access) return res.status(404).json({ error: "Group not found" });

      const group = access.group;
      const { description, amount, payerId, shares } = req.body || {};
      const total = parseFloat(amount);
      if (!description?.trim() || isNaN(total) || total <= 0) {
        return res.status(400).json({ error: "Valid description and amount required" });
      }
      if (!payerId || !group.members.some((m) => m.id === payerId)) {
        return res.status(400).json({ error: "Invalid payer" });
      }
      if (!Array.isArray(shares) || shares.length === 0) {
        return res.status(400).json({ error: "Shares are required" });
      }

      const shareTotal = shares.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
      if (Math.abs(shareTotal - total) > 0.02) {
        return res.status(400).json({ error: "Share amounts must equal expense total" });
      }

      await db.splitExpense.create({
        data: {
          groupId: group.id,
          description: description.trim(),
          amount: total,
          payerId,
          shares: {
            create: shares.map((s) => ({
              memberId: s.memberId,
              amount: parseFloat(s.amount),
            })),
          },
        },
      });

      const updated = await db.splitGroup.findUnique({
        where: { id: group.id },
        include: GROUP_INCLUDE,
      });
      res.status(201).json(
        serializeGroup(updated, {
          role: access.role,
          memberId: access.memberId,
        })
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:groupId/expenses/:expenseId", requireAuth, async (req, res) => {
    try {
      const access = await findAccessibleGroup(req.user.userId, req.params.groupId);
      if (!access) return res.status(404).json({ error: "Group not found" });
      if (access.role !== "owner") {
        return res.status(403).json({ error: "Only the group owner can delete expenses" });
      }

      const group = access.group;
      const expense = await db.splitExpense.findFirst({
        where: { id: req.params.expenseId, groupId: group.id },
      });
      if (!expense) return res.status(404).json({ error: "Expense not found" });

      await db.splitExpense.delete({ where: { id: expense.id } });

      const updated = await db.splitGroup.findUnique({
        where: { id: group.id },
        include: GROUP_INCLUDE,
      });
      res.json(
        serializeGroup(updated, {
          role: access.role,
          memberId: access.memberId,
        })
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:id/settlements", requireAuth, async (req, res) => {
    try {
      const access = await findAccessibleGroup(req.user.userId, req.params.id);
      if (!access) return res.status(404).json({ error: "Group not found" });

      const group = access.group;
      const { fromMemberId, toMemberId, amount, note } = req.body || {};
      const total = parseFloat(amount);
      if (!fromMemberId || !toMemberId || fromMemberId === toMemberId) {
        return res.status(400).json({ error: "Valid from and to members required" });
      }
      if (isNaN(total) || total <= 0) {
        return res.status(400).json({ error: "Valid amount required" });
      }
      const memberIds = new Set(group.members.map((m) => m.id));
      if (!memberIds.has(fromMemberId) || !memberIds.has(toMemberId)) {
        return res.status(400).json({ error: "Invalid member" });
      }

      await db.splitSettlement.create({
        data: {
          groupId: group.id,
          fromMemberId,
          toMemberId,
          amount: total,
          note: note?.trim() || null,
        },
      });

      const updated = await db.splitGroup.findUnique({
        where: { id: group.id },
        include: GROUP_INCLUDE,
      });
      res.status(201).json(serializeGroup(updated, { role: "owner" }));
    } catch (error) {
      if (error.code === "P2021") {
        return res.status(503).json({
          error: "Run npm run db:push to enable split settlements",
        });
      }
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:groupId/settlements/:settlementId", requireAuth, async (req, res) => {
    try {
      const access = await findAccessibleGroup(req.user.userId, req.params.groupId);
      if (!access) return res.status(404).json({ error: "Group not found" });
      if (access.role !== "owner") {
        return res.status(403).json({ error: "Only the group owner can remove settlements" });
      }

      const group = access.group;
      const settlement = await db.splitSettlement.findFirst({
        where: { id: req.params.settlementId, groupId: group.id },
      });
      if (!settlement) return res.status(404).json({ error: "Settlement not found" });

      await db.splitSettlement.delete({ where: { id: settlement.id } });

      const updated = await db.splitGroup.findUnique({
        where: { id: group.id },
        include: GROUP_INCLUDE,
      });
      res.json(
        serializeGroup(updated, {
          role: access.role,
          memberId: access.memberId,
        })
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
