import { NextRequest } from "next/server";
import { streamGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a senior performance engineer optimizing code for runtime, memory, and readability.

Analyze the given code and respond with ONLY valid JSON (no markdown fences, no prose outside the JSON) matching exactly this shape:

{
  "language": string,
  "summary": string,                 // 1-2 sentence overview of what was optimized and why
  "before": {
    "timeComplexity": string,        // e.g. "O(n^2)"
    "spaceComplexity": string,       // e.g. "O(1)"
    "code": string                   // the original code, unmodified
  },
  "after": {
    "timeComplexity": string,
    "spaceComplexity": string,
    "code": string                   // the optimized rewrite, complete and runnable
  },
  "changes": [
    {
      "id": string,                  // short slug
      "title": string,               // e.g. "Replaced nested loop with hash lookup"
      "type": "runtime" | "memory" | "readability" | "redundancy" | "complexity",
      "explanation": string          // why this change improves things
    }
  ]
}

Rules:
- If the code is already optimal, say so in "summary", keep "after" identical to "before", and return an empty "changes" array.
- "after.code" must be complete and correct — not a snippet, not pseudocode.
- Be honest about complexity: don't claim an improvement that didn't happen.
- Output raw JSON only — the response will be parsed with JSON.parse().`;

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return new Response(JSON.stringify({ error: "No code provided." }), { status: 400 });
    }
    if (code.length > 60_000) {
      return new Response(
        JSON.stringify({ error: "File is too large for a single optimization pass (60k char limit)." }),
        { status: 413 }
      );
    }

    const prompt = `Language (auto-detected, may be wrong — verify yourself): ${language}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamGemini(prompt, SYSTEM_PROMPT)) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: err instanceof Error ? err.message : "AI request failed." })
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unexpected server error." }),
      { status: 500 }
    );
  }
}
