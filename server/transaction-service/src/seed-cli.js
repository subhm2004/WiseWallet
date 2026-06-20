import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { db } from "@wisewallet/database";
import { formatMoney } from "@wisewallet/shared";
import { seedUserData } from "./seed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../packages/database/.env") });

const arg = process.argv[2];

async function main() {
  if (!arg) {
    console.error("Usage: npm run db:seed -- <user-email>");
    console.error("       npm run db:seed -- --all");
    process.exit(1);
  }

  let users;

  if (arg === "--all") {
    users = await db.user.findMany({ select: { id: true, email: true } });
    if (users.length === 0) {
      console.error("No users found. Login with Google first to create an account.");
      process.exit(1);
    }
  } else {
    const user = await db.user.findUnique({ where: { email: arg } });
    if (!user) {
      console.error(`User not found: ${arg}`);
      console.error("Login with Google first, then run seed again.");
      process.exit(1);
    }
    users = [user];
  }

  for (const user of users) {
    const result = await seedUserData(user.id);
    console.log(
      `✓ ${user.email}: ${result.message}, balance ${formatMoney(result.balance)}, budget ${formatMoney(result.budget)}`
    );
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
