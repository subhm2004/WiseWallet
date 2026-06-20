import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { db } from "@wisewallet/database";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../packages/database/.env") });
dotenv.config({ path: resolve(__dirname, "../.env") });

const email = process.argv[2];
const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4005";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

async function main() {
  if (!email) {
    console.error("Usage: npm run email:test -- <user-email>");
    process.exit(1);
  }

  if (!INTERNAL_SECRET) {
    console.error("INTERNAL_SERVICE_SECRET not set in notification-service/.env");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h1 style="color:#ef4444;">WiseWallet Test Email</h1>
      <p>Hello ${user.name || "there"},</p>
      <p>This is a test email from WiseWallet. Your email setup is working!</p>
      <p style="color:#666;font-size:12px;">Sent at ${new Date().toLocaleString()}</p>
    </div>
  `;

  const res = await fetch(`${NOTIFICATION_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_SECRET,
    },
    body: JSON.stringify({
      to: user.email,
      subject: "WiseWallet — Test Email",
      html,
      userId: user.id,
      type: "test",
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("Failed:", data.error || res.statusText);
    process.exit(1);
  }

  console.log(`✓ Test email sent to ${user.email}`);
  console.log("  Check your inbox (and Spam/Promotions tabs)");
  console.log("  Dashboard → Email Notifications section mein bhi dikhega");

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
