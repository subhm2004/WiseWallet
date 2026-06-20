import { db } from "@wisewallet/database";

const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

function subDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function randomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function pickCategory(type) {
  const list = CATEGORIES[type];
  const cat = list[Math.floor(Math.random() * list.length)];
  return { category: cat.name, amount: randomAmount(cat.range[0], cat.range[1]) };
}

export async function seedUserData(userId) {
  let account = await db.account.findFirst({
    where: { userId, isDefault: true },
  });

  if (!account) {
    account = await db.account.findFirst({ where: { userId } });
  }

  if (!account) {
    account = await db.account.create({
      data: {
        name: "Main Account",
        type: "CURRENT",
        balance: 0,
        isDefault: true,
        userId,
      },
    });
  }

  const transactions = [];
  let totalBalance = 0;

  for (let i = 90; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const count = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < count; j++) {
      const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
      const { category, amount } = pickCategory(type);

      transactions.push({
        type,
        amount,
        description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
        date,
        category,
        status: "COMPLETED",
        userId,
        accountId: account.id,
      });

      totalBalance += type === "INCOME" ? amount : -amount;
    }
  }

  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { userId } });

    await tx.transaction.createMany({ data: transactions });

    await tx.account.update({
      where: { id: account.id },
      data: { balance: totalBalance },
    });

    await tx.budget.upsert({
      where: { userId },
      update: { amount: 5000 },
      create: { userId, amount: 5000 },
    });
  });

  return {
    success: true,
    message: `Created ${transactions.length} sample transactions`,
    accountId: account.id,
    transactionCount: transactions.length,
    balance: totalBalance,
    budget: 5000,
  };
}
