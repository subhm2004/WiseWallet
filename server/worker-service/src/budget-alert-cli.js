import "./load-env.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { db } from "@wisewallet/database";
import { SERVICE_PORTS, formatMoney } from "@wisewallet/shared";
import { buildBudgetAlertEmail, toNumber } from "./emails/budget-alert.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../packages/database/.env"), override: true });

const email = process.argv[2];
const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL || `http://localhost:${SERVICE_PORTS.NOTIFICATION}`;
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

async function main() {
  if (!email) {
    console.error("Usage: npm run email:budget-alert -- <user-email>");
    process.exit(1);
  }

  if (!INTERNAL_SECRET) {
    console.error("INTERNAL_SERVICE_SECRET not set");
    process.exit(1);
  }

  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY not set in worker-service/.env");
    process.exit(1);
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { budgets: true, accounts: { where: { isDefault: true } } },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const budget = user.budgets;
  const account = user.accounts[0];

  if (!budget || !account) {
    console.error("User needs a budget and default account");
    process.exit(1);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const budgetAmount = toNumber(budget.amount);

  console.log("Generating AI insights...");

  const { html, percentageUsed } = await buildBudgetAlertEmail(db, {
    userId: user.id,
    userName: user.name,
    accountId: account.id,
    accountName: account.name,
    budgetAmount,
    startOfMonth,
    endOfMonth,
  });

  const res = await fetch(`${NOTIFICATION_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_SECRET,
    },
    body: JSON.stringify({
      to: user.email,
      subject: `⚠️ Budget Alert — ${percentageUsed.toFixed(0)}% used on ${account.name}`,
      html,
      userId: user.id,
      type: "budget-alert",
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("Failed:", data.error || res.statusText);
    process.exit(1);
  }

  await db.budget.update({
    where: { id: budget.id },
    data: { lastAlertSent: now },
  });

  console.log(`✓ Budget alert sent to ${user.email}`);
  console.log(`  Used ${percentageUsed.toFixed(1)}% of ${formatMoney(budgetAmount)} budget`);
  console.log("  Check Gmail Promotions/Spam if not in Primary");

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
