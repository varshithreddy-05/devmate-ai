import { NextRequest } from "next/server";
import { streamGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a senior staff software engineer performing a rigorous code review.

Analyze the given code and respond with ONLY valid JSON (no markdown fences, no prose outside the JSON) matching exactly this shape:

{
  "language": string,
  "summary": string,               // 1-2 sentence overall assessment
  "overallSeverity": "critical" | "high" | "medium" | "low" | "clean",
  "issues": [
    {
      "id": string,                // short slug, e.g. "sql-injection-1"
      "title": string,
      "category": "bug" | "vulnerability" | "bad-practice" | "code-smell",
      "severity": "critical" | "high" | "medium" | "low",
      "line": number | null,       // best-guess line number in the ORIGINAL code, or null
      "explanation": string,       // why this is a problem, in plain language
      "suggestion": string,        // how to fix it, in plain language
      "before": string,            // the exact problematic snippet
      "after": string              // the corrected snippet
    }
  ]
}

Rules:
- Find real issues only. If the code is clean, return an empty "issues" array and say so in "summary".
- Be specific: reference actual variable/function names from the code.
- "before" and "after" must be short, focused snippets (not the whole file).
- Order issues by severity, most severe first.
- Output raw JSON only — the response will be parsed with JSON.parse().`;

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return new Response(JSON.stringify({ error: "No code provided." }), { status: 400 });
    }
    if (code.length > 60_000) {
      return new Response(
        JSON.stringify({ error: "File is too large for a single review pass (60k char limit)." }),
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
