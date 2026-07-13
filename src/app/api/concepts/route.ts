import { NextRequest } from "next/server";
import { streamGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a computer science educator analyzing code to identify every concept it demonstrates.

Respond with ONLY valid JSON (no markdown fences, no prose outside the JSON) matching exactly this shape:

{
  "language": string,
  "concepts": [
    {
      "id": string,                    // short slug, e.g. "two-pointers"
      "name": string,                  // display name, e.g. "Two Pointers"
      "category": "data-structure" | "algorithm" | "paradigm" | "language-feature" | "pattern",
      "whyUsed": string,                // where/why this specific concept appears in THIS code
      "complexity": string,             // relevant time/space complexity if applicable, else "N/A"
      "interviewImportance": "high" | "medium" | "low",
      "relatedConcepts": string[],      // 2-4 related concept names
      "commonMistakes": string          // a common mistake developers make with this concept
    }
  ]
}

Rules:
- Only list concepts that are ACTUALLY present in the given code — reference specific lines/variables/functions in "whyUsed".
- Cover data structures, algorithms, OOP, recursion, concurrency, design patterns, language-specific features (comprehensions, generics, lambdas, etc.) — whatever genuinely appears.
- Do not pad the list with generic concepts ("variables", "loops") unless they are the actual point of the code (e.g. a sorting algorithm's loop IS the point).
- Order by interview importance, then by how central the concept is to the code.
- Output raw JSON only — the response will be parsed with JSON.parse().`;

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return new Response(JSON.stringify({ error: "No code provided." }), { status: 400 });
    }
    if (code.length > 60_000) {
      return new Response(
        JSON.stringify({ error: "File is too large for a single analysis pass (60k char limit)." }),
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

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unexpected server error." }),
      { status: 500 }
    );
  }
}
