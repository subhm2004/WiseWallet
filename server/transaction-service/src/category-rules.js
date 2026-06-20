import { db } from "@wisewallet/database";

export async function applyCategoryRules(userId, description, fallbackCategory) {
  if (!description?.trim()) return fallbackCategory;

  const rules = await db.categoryRule.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const text = description.toLowerCase();
  for (const rule of rules) {
    if (text.includes(rule.pattern.toLowerCase())) {
      return rule.category;
    }
  }
  return fallbackCategory;
}

export async function listCategoryRules(userId) {
  return db.categoryRule.findMany({
    where: { userId },
    orderBy: { pattern: "asc" },
  });
}
