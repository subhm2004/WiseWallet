export const CURRENCY_SYMBOL = "₹";

export function formatMoney(amount, options = {}) {
  const num = Number(amount);
  if (Number.isNaN(num)) return `${CURRENCY_SYMBOL}0.00`;

  const { showSign = false, minimumFractionDigits = 2, maximumFractionDigits = 2 } =
    options;

  const formatted = Math.abs(num).toLocaleString("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const sign = num < 0 ? "-" : showSign && num > 0 ? "+" : "";
  return `${sign}${CURRENCY_SYMBOL}${formatted}`;
}
