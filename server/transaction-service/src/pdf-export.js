import PDFDocument from "pdfkit";
import { formatMoney } from "@wisewallet/shared";
import { getMonthlyAnalytics, getOverview } from "./analytics.js";

function formatCategory(name) {
  return String(name)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function drawBarChart(doc, items, x, y, width, height, color = "#f97316") {
  if (!items.length) return y + height + 20;

  const max = Math.max(...items.map((i) => i.value), 1);
  const barWidth = Math.min(48, (width - (items.length - 1) * 8) / items.length);
  const gap = 8;
  let cx = x;

  doc.fontSize(8).fillColor("#64748b");
  for (const item of items) {
    const barH = (item.value / max) * (height - 24);
    doc
      .rect(cx, y + height - barH - 16, barWidth, barH)
      .fill(color);
    doc.text(item.label, cx, y + height - 8, {
      width: barWidth,
      align: "center",
      lineBreak: false,
    });
    cx += barWidth + gap;
  }

  return y + height + 28;
}

export async function generateMonthlyPdf(userId, userName) {
  const [monthly, overview] = await Promise.all([
    getMonthlyAnalytics(userId, 6),
    getOverview(userId),
  ]);

  const current = monthly[monthly.length - 1];
  const monthName = current?.month || new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(22)
      .fillColor("#f97316")
      .text("WiseWallet", { continued: true })
      .fillColor("#0f172a")
      .text(" Monthly Report");
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor("#64748b").text(`${monthName} · ${userName || "User"}`);
    doc.moveDown(1);

    doc.fontSize(14).fillColor("#0f172a").text("Summary");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#334155");
    doc.text(`Net worth: ${formatMoney(overview.netWorth)}`);
    doc.text(`This month income: ${formatMoney(current?.income || 0)}`);
    doc.text(`This month expenses: ${formatMoney(current?.expenses || 0)}`);
    doc.text(`Net this month: ${formatMoney(current?.net || 0)}`);
    if (overview.budgetAmount) {
      const pct = overview.monthlyExpenses
        ? ((overview.monthlyExpenses / overview.budgetAmount) * 100).toFixed(0)
        : 0;
      doc.text(`Budget used: ${pct}% of ${formatMoney(overview.budgetAmount)}`);
    }
    doc.moveDown(1.2);

    doc.fontSize(14).fillColor("#0f172a").text("Income vs Expenses (6 months)");
    doc.moveDown(0.5);
    const trendY = doc.y;
    const chartItems = monthly.slice(-6).map((m) => ({
      label: m.month.split(" ")[0],
      value: m.expenses,
    }));
    let nextY = drawBarChart(doc, chartItems, 50, trendY, 480, 120, "#f97316");

    doc.y = nextY;
    doc.fontSize(14).fillColor("#0f172a").text("Top categories this month");
    doc.moveDown(0.5);

    const categories = Object.entries(current?.byCategory || {})
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    if (categories.length) {
      const catItems = categories.map((c) => ({
        label: formatCategory(c.name).slice(0, 8),
        value: c.amount,
      }));
      nextY = drawBarChart(doc, catItems, 50, doc.y, 480, 100, "#6366f1");
      doc.y = nextY;
      doc.fontSize(10).fillColor("#334155");
      for (const c of categories) {
        doc.text(`• ${formatCategory(c.name)}: ${formatMoney(c.amount)}`);
      }
    } else {
      doc.fontSize(10).fillColor("#64748b").text("No expense data this month.");
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#94a3b8").text(
      `Generated ${new Date().toLocaleString()} · wisewallet.app`,
      { align: "center" }
    );

    doc.end();
  });
}
