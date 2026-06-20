const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

const RECEIPT_PROMPT = `You are a receipt parser. Extract data from this receipt image.

Return ONLY valid JSON with this exact shape:
{
  "amount": 0,
  "date": "2024-01-15T00:00:00.000Z",
  "description": "brief summary of purchase",
  "merchantName": "store name",
  "category": "food"
}

Rules:
- amount must be a number (total paid)
- date must be ISO 8601 string
- category must be one of: housing, transportation, groceries, utilities, entertainment, food, shopping, healthcare, education, personal, travel, insurance, gifts, bills, other-expense
- If the image is NOT a receipt, return: {"amount": null}`;

export async function scanReceiptImage(groq, fileBuffer, mimeType) {
  const base64 = fileBuffer.toString("base64");
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  const type = allowedTypes.includes(mimeType) ? mimeType : "image/jpeg";

  const completion = await groq.chat.completions.create({
    model: GROQ_VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: RECEIPT_PROMPT },
          {
            type: "image_url",
            image_url: { url: `data:${type};base64,${base64}` },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1024,
  });

  const text = completion.choices[0]?.message?.content || "{}";
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.amount || parsed.amount === null) {
    return null;
  }

  const amount = parseFloat(String(parsed.amount).replace(/[^0-9.]/g, ""));
  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  let date = parsed.date ? new Date(parsed.date) : new Date();
  if (isNaN(date.getTime())) date = new Date();

  return {
    amount,
    date: date.toISOString(),
    description: parsed.description || parsed.merchantName || "Receipt purchase",
    category: parsed.category || "other-expense",
    merchantName: parsed.merchantName || "",
  };
}
