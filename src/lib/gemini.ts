// Groq's API is OpenAI-compatible, so this is a plain fetch wrapper —
// no SDK needed. Free tier: no credit card, generous daily limits.
// Get a key at https://console.groq.com/keys

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!process.env.GROQ_API_KEY) {
  console.warn("[groq] GROQ_API_KEY is not set — AI routes will fail until it is.");
}

/**
 * Streams a chat completion from Groq and yields text chunks as they arrive.
 * Same generator shape as the old Gemini helper, so callers don't change.
 */
export async function* streamGemini(prompt: string, systemInstruction: string) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      stream: true,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Groq request failed (${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Groq streams Server-Sent Events: lines like `data: {...}` separated by \n\n
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // Ignore partial/malformed SSE chunks — the buffer above will
        // complete them on the next read.
      }
    }
  }
}

/** Simple retry-with-backoff wrapper for non-streaming calls. */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 800): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastErr;
}
