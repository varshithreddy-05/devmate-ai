import { NextRequest } from "next/server";
import { streamGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a senior software engineer who translates code between programming languages while preserving exact behavior.

Respond with ONLY valid JSON (no markdown fences, no prose outside the JSON) matching exactly this shape:

{
  "sourceLanguage": string,
  "targetLanguage": string,
  "convertedCode": string,          // complete, runnable, idiomatic code in the target language
  "notes": [
    {
      "title": string,              // short label, e.g. "List comprehension → stream()"
      "explanation": string         // what changed and why, for a specific construct
    }
  ]
}

Rules:
- "convertedCode" must be complete and idiomatic for the target language — not a literal line-by-line transliteration unless that IS idiomatic.
- Preserve behavior exactly. If something has no direct equivalent, pick the closest idiomatic pattern and explain the tradeoff in "notes".
- Include imports/includes/using-statements the target code actually needs.
- Order "notes" by how significant the translation decision was, most significant first.
- Output raw JSON only — the response will be parsed with JSON.parse().`;

export async function POST(req: NextRequest) {
  try {
    const { code, sourceLanguage, targetLanguage } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return new Response(JSON.stringify({ error: "No code provided." }), { status: 400 });
    }
    if (!targetLanguage || typeof targetLanguage !== "string") {
      return new Response(JSON.stringify({ error: "No target language specified." }), { status: 400 });
    }
    if (code.length > 60_000) {
      return new Response(
        JSON.stringify({ error: "File is too large for a single conversion pass (60k char limit)." }),
        { status: 413 }
      );
    }

    const prompt = `Source language (auto-detected, may be wrong — verify yourself): ${sourceLanguage}\nTarget language: ${targetLanguage}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

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
