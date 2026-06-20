import { buildFinanceContext } from "./analytics.js";
import { formatMoney } from "@wisewallet/shared";

export async function askFinanceCoach(groq, userId, question) {
  const { overview, monthly, recentLines } = await buildFinanceContext(userId);

  const monthSummary = monthly
    .map(
      (m) =>
        `${m.month}: income ${formatMoney(m.income)}, expenses ${formatMoney(m.expenses)}, net ${formatMoney(m.net, { showSign: true })}`
    )
    .join("\n");

  const systemPrompt = `You are WiseWallet AI Finance Coach — friendly, concise, and practical.
Use the user's real financial data below. Give specific numbers when helpful.
Always use Indian Rupee (₹) when mentioning amounts.
Keep answers under 120 words unless listing tips. Use plain text, no markdown headers.`;

  const dataContext = `Current overview:
- Net worth: ${formatMoney(overview.netWorth)}
- This month income: ${formatMoney(overview.monthlyIncome)}
- This month expenses: ${formatMoney(overview.monthlyExpenses)}
- Budget limit: ${overview.budgetAmount ? formatMoney(overview.budgetAmount) : "not set"}
- Top spending category: ${overview.topCategory ? `${overview.topCategory.name} (${formatMoney(overview.topCategory.amount)})` : "none yet"}
- Recurring transactions: ${overview.recurringCount}

Last 3 months:
${monthSummary}

Recent transactions:
${recentLines}`;

  const userMessage =
    question?.trim() ||
    "Give me 3 actionable insights about my spending this month and one specific way to save money.";

  if (!process.env.GROQ_API_KEY) {
    return {
      answer:
        "AI coach needs GROQ_API_KEY configured. Set it in transaction-service/.env to enable insights.",
      insights: [],
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${dataContext}\n\nUser question: ${userMessage}`,
        },
      ],
      temperature: 0.4,
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "No insights available.";

    return { answer };
  } catch (error) {
    console.error("[insights] Groq error:", error.message);
    return {
      answer:
        "Could not generate insights right now. Check your Groq API key and try again.",
    };
  }
}

export async function generateMonthlyInsights(groq, userId) {
  const { monthly, overview } = await buildFinanceContext(userId);
  const current = monthly[monthly.length - 1];

  if (!process.env.GROQ_API_KEY) {
    return [
      `You spent ${formatMoney(current?.expenses || 0)} this month across all accounts.`,
      overview.budgetAmount
        ? `Your budget is ${formatMoney(overview.budgetAmount)} — track progress on the dashboard.`
        : "Set a monthly budget on your dashboard to stay on track.",
      "Configure GROQ_API_KEY for personalized AI insights.",
    ];
  }

  const prompt = `Analyze this financial data and return exactly 3 short insights as a JSON array of strings.
Use Indian Rupee (₹) symbol for all amounts in your response.

Data for ${current?.month || "this month"}:
- Income: ${formatMoney(current?.income || 0)}
- Expenses: ${formatMoney(current?.expenses || 0)}
- Categories: ${Object.entries(current?.byCategory || {})
    .map(([c, a]) => `${c}: ${formatMoney(a)}`)
    .join(", ") || "none"}
- Net worth: ${formatMoney(overview.netWorth)}
- Budget: ${overview.budgetAmount ? formatMoney(overview.budgetAmount) : "not set"}

Return only JSON: ["insight1", "insight2", "insight3"]`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const text = completion.choices[0]?.message?.content || "[]";
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
  } catch {
    return [
      `Expenses this month: ${formatMoney(current?.expenses || 0)}.`,
      overview.topCategory
        ? `Highest category: ${overview.topCategory.name}.`
        : "Add transactions to unlock category insights.",
      "Review recurring payments to find savings.",
    ];
  }
}
