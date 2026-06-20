import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export function serializeDecimal(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const serialized = { ...obj };
  if (obj.balance !== undefined && obj.balance !== null) {
    serialized.balance =
      typeof obj.balance.toNumber === "function"
        ? obj.balance.toNumber()
        : obj.balance;
  }
  if (obj.amount !== undefined && obj.amount !== null) {
    serialized.amount =
      typeof obj.amount.toNumber === "function"
        ? obj.amount.toNumber()
        : obj.amount;
  }
  return serialized;
}
