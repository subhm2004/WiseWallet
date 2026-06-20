/**
 * Parse bank statement CSV exports (HDFC, SBI, PhonePe, generic).
 */

import { applyCategoryRules } from "./category-rules.js";

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmount(raw) {
  if (raw == null || raw === "") return null;
  const cleaned = String(raw)
    .replace(/[₹,\s]/g, "")
    .replace(/DR$/i, "")
    .replace(/CR$/i, "")
    .trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const formats = [
    /^(\d{2})[/-](\d{2})[/-](\d{4})$/,
    /^(\d{2})[/-](\d{2})[/-](\d{2})$/,
    /^(\d{4})[/-](\d{2})[/-](\d{2})$/,
  ];
  for (const re of formats) {
    const m = s.match(re);
    if (!m) continue;
    let day, month, year;
    if (m[1].length === 4) {
      [, year, month, day] = m;
    } else {
      [, day, month, year] = m;
      if (year.length === 2) year = `20${year}`;
    }
    const d = new Date(`${year}-${month}-${day}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function normHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectFormat(headers) {
  const h = headers.map(normHeader);
  const joined = h.join("|");

  if (joined.includes("withdrawal") || joined.includes("depositamt") || joined.includes("narration")) {
    return "hdfc";
  }
  if (joined.includes("txndate") && joined.includes("debit") && joined.includes("credit")) {
    return "sbi";
  }
  if (joined.includes("phonepe") || (joined.includes("type") && joined.includes("status") && joined.includes("amount"))) {
    return "phonepe";
  }
  if (joined.includes("date") && joined.includes("description") && joined.includes("amount")) {
    return "generic";
  }
  return "generic";
}

function colIndex(headers, ...names) {
  const normalized = headers.map(normHeader);
  for (const name of names) {
    const idx = normalized.findIndex((h) => h.includes(name));
    if (idx >= 0) return idx;
  }
  return -1;
}

function inferCategory(description) {
  const d = (description || "").toLowerCase();
  if (/swiggy|zomato|restaurant|food|dominos|mcdonald/.test(d)) return "food-dining";
  if (/uber|ola|metro|fuel|petrol|diesel|irctc|makemytrip/.test(d)) return "transportation";
  if (/netflix|spotify|prime|hotstar|youtube|subscription/.test(d)) return "entertainment";
  if (/amazon|flipkart|myntra|shopping/.test(d)) return "shopping";
  if (/rent|electricity|water|gas|bill|recharge|jio|airtel/.test(d)) return "utilities";
  if (/salary|credit|interest|refund|cashback/.test(d)) return "income";
  if (/medical|pharmacy|hospital|doctor/.test(d)) return "healthcare";
  if (/gym|fitness/.test(d)) return "personal-care";
  return "other";
}

function parseRow(cells, headers, format) {
  if (format === "hdfc") {
    const dateIdx = colIndex(headers, "date");
    const descIdx = colIndex(headers, "narration", "description");
    const debitIdx = colIndex(headers, "withdrawal", "debit");
    const creditIdx = colIndex(headers, "deposit", "credit");
    const date = parseDate(cells[dateIdx]);
    const description = cells[descIdx] || "Bank transaction";
    const debit = parseAmount(cells[debitIdx]);
    const credit = parseAmount(cells[creditIdx]);
    if (!date || (!debit && !credit)) return null;
    return {
      date,
      description: description.slice(0, 200),
      amount: debit || credit,
      type: debit ? "EXPENSE" : "INCOME",
      category: inferCategory(description),
    };
  }

  if (format === "sbi") {
    const dateIdx = colIndex(headers, "txndate", "date");
    const descIdx = colIndex(headers, "description", "narration");
    const debitIdx = colIndex(headers, "debit", "withdrawal");
    const creditIdx = colIndex(headers, "credit", "deposit");
    const date = parseDate(cells[dateIdx]);
    const description = cells[descIdx] || "Bank transaction";
    const debit = parseAmount(cells[debitIdx]);
    const credit = parseAmount(cells[creditIdx]);
    if (!date || (!debit && !credit)) return null;
    return {
      date,
      description: description.slice(0, 200),
      amount: debit || credit,
      type: debit ? "EXPENSE" : "INCOME",
      category: inferCategory(description),
    };
  }

  if (format === "phonepe") {
    const dateIdx = colIndex(headers, "date", "time");
    const descIdx = colIndex(headers, "description", "note", "toname");
    const amountIdx = colIndex(headers, "amount");
    const typeIdx = colIndex(headers, "type");
    const statusIdx = colIndex(headers, "status");
    const status = (cells[statusIdx] || "").toLowerCase();
    if (status && !status.includes("success") && status !== "completed") return null;
    const date = parseDate(cells[dateIdx]);
    const description = cells[descIdx] || cells[typeIdx] || "UPI transaction";
    const amount = parseAmount(cells[amountIdx]);
    if (!date || !amount) return null;
    const txnType = (cells[typeIdx] || "").toLowerCase();
    const isCredit = txnType.includes("received") || txnType.includes("credit");
    return {
      date,
      description: description.slice(0, 200),
      amount,
      type: isCredit ? "INCOME" : "EXPENSE",
      category: inferCategory(description),
    };
  }

  // generic
  const dateIdx = colIndex(headers, "date");
  const descIdx = colIndex(headers, "description", "narration", "particulars", "memo");
  const amountIdx = colIndex(headers, "amount");
  const debitIdx = colIndex(headers, "debit", "withdrawal");
  const creditIdx = colIndex(headers, "credit", "deposit");
  const typeIdx = colIndex(headers, "type");

  const date = parseDate(cells[dateIdx]);
  const description = cells[descIdx] || "Imported transaction";
  let amount = parseAmount(cells[amountIdx]);
  let type = "EXPENSE";

  if (!amount) {
    const debit = parseAmount(cells[debitIdx]);
    const credit = parseAmount(cells[creditIdx]);
    if (debit) {
      amount = debit;
      type = "EXPENSE";
    } else if (credit) {
      amount = credit;
      type = "INCOME";
    }
  } else if (typeIdx >= 0) {
    const t = (cells[typeIdx] || "").toLowerCase();
    if (t.includes("credit") || t.includes("income") || t.includes("received")) {
      type = "INCOME";
    }
  }

  if (!date || !amount) return null;
  return {
    date,
    description: description.slice(0, 200),
    amount,
    type,
    category: inferCategory(description),
  };
}

export function parseBankCsv(text, formatHint) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { format: "unknown", rows: [], errors: ["CSV must have a header row and at least one data row"] };
  }

  const headers = parseCsvLine(lines[0]);
  const format = formatHint && formatHint !== "auto" ? formatHint : detectFormat(headers);
  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.every((c) => !c)) continue;
    try {
      const row = parseRow(cells, headers, format);
      if (row) rows.push(row);
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e.message}`);
    }
  }

  return { format, rows, errors, totalLines: lines.length - 1 };
}

export async function importCsvRows(db, userId, accountId, rows, { applyRules, skipDuplicates }) {
  let imported = 0;
  let skipped = 0;
  const errors = [];

  if (!accountId) throw new Error("Account is required");

  const account = await db.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) throw new Error("Account not found");

  let balanceDelta = 0;

  for (const row of rows) {
    try {
      if (skipDuplicates) {
        const start = new Date(row.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(row.date);
        end.setHours(23, 59, 59, 999);
        const dup = await db.transaction.findFirst({
          where: {
            userId,
            accountId,
            amount: row.amount,
            date: { gte: start, lte: end },
            description: { contains: row.description.slice(0, 40), mode: "insensitive" },
          },
        });
        if (dup) {
          skipped++;
          continue;
        }
      }

      let category = row.category;
      if (applyRules) {
        category = await applyCategoryRules(userId, row.description, category);
      }

      await db.transaction.create({
        data: {
          userId,
          accountId,
          type: row.type,
          amount: row.amount,
          description: row.description,
          date: row.date,
          category,
        },
      });

      balanceDelta += row.type === "EXPENSE" ? -row.amount : row.amount;
      imported++;
    } catch (e) {
      errors.push(e.message);
    }
  }

  if (imported > 0) {
    await db.account.update({
      where: { id: accountId },
      data: { balance: { increment: balanceDelta } },
    });
  }

  return { imported, skipped, errors };
}
