import { defaultCategories } from "@/data/categories";

export function formatCategoryName(id) {
  const found = defaultCategories.find((c) => c.id === id);
  if (found) return found.name;
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getCategoryColor(id) {
  return defaultCategories.find((c) => c.id === id)?.color || "#64748b";
}

export const expenseCategories = defaultCategories.filter((c) => c.type === "EXPENSE");
