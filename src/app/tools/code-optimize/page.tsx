"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Play, Loader2, Gauge, Clock, Database, Copy } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { LanguageSelect } from "@/components/LanguageSelect";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  detectLanguage,
  MONACO_LANG_MAP,
  SUPPORTED_LANGUAGES,
  type DetectedLanguage,
} from "@/lib/detectLanguage";
import { useAppStore } from "@/store/useAppStore";

interface Change {
  id: string;
  title: string;
  type: "runtime" | "memory" | "readability" | "redundancy" | "complexity";
  explanation: string;
}
interface OptimizeResult {
  language: string;
  summary: string;
  before: { timeComplexity: string; spaceComplexity: string; code: string };
  after: { timeComplexity: string; spaceComplexity: string; code: string };
  changes: Change[];
}

const TYPE_STYLE: Record<string, string> = {
  runtime: "bg-accent-dim text-accent",
  memory: "bg-mint-dim text-mint",
  readability: "bg-amber-dim text-amber",
  redundancy: "bg-danger-dim text-danger",
  complexity: "bg-accent-dim text-accent",
};

// Shared clipboard helper — used by the "Copy optimized code" button.
async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard.`);
  } catch {
    toast.error("Couldn't copy — clipboard access is blocked in this browser.");
  }
}

export default function CodeOptimizePage() {
  // Code + detected language live in the shared store (not local useState)
  // so they survive switching to another tool page and back.
  const code = useAppStore((s) => s.currentCode);
  const setCode = useAppStore((s) => s.setCurrentCode);
  const language = useAppStore((s) => s.currentLanguage);
  const setLanguage = useAppStore((s) => s.setCurrentLanguage);

  const [overrideLang, setOverrideLang] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const addHistoryItem = useAppStore((s) => s.addHistoryItem);

  function handleCodeChange(v: string) {
    setCode(v);
    if (!overrideLang) setLanguage(detectLanguage(v));
  }

  async function runOptimize() {
    if (!code.trim()) {
      toast.error("Paste or upload some code first.");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.body) throw new Error("No response stream from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }

      const cleaned = full.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
      const parsed: OptimizeResult | { error: string } = JSON.parse(cleaned);
      if ("error" in parsed) throw new Error(parsed.error);

      setResult(parsed);
      addHistoryItem({
        id: crypto.randomUUID(),
        tool: "code-optimize",
        language,
        codeSnippet: code.slice(0, 200),
        createdAt: Date.now(),
        pinned: false,
        favorite: false,
      });
      toast.success(`Optimized: ${parsed.changes.length} change(s) applied.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Optimization failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <LanguageSelect
                value={overrideLang ? language : "auto"}
                onChange={(v) => {
                  if (v === "auto") {
                    setOverrideLang(false);
                    setLanguage(detectLanguage(code));
                  } else {
                    setOverrideLang(true);
                    setLanguage(v as DetectedLanguage);
                  }
                }}
                options={[
                  { value: "auto", label: "Auto Detect" },
                  ...SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: l })),
                ]}
              />
            </div>
          <button
            onClick={runOptimize}
            disabled={loading}
            className="focus-ring flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? "Optimizing..." : "Run optimization"}
          </button>
        </div>
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          language={MONACO_LANG_MAP[language]}
          placeholder="Paste your code here to analyze time & space complexity and get an optimized rewrite..."
        />
      </div>

      <div className="flex flex-col gap-3">
        {!result && !loading && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
            <Gauge size={22} className="mb-3 text-ink-faint" />
            <p className="text-sm text-ink-muted">
              Run optimization to see complexity before/after and a rewritten version here.
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-bg-surface p-4">
                <div className="mb-2 h-3 w-1/3 rounded bg-bg-raised" />
                <div className="h-3 w-2/3 rounded bg-bg-raised" />
              </div>
            ))}
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-xl border border-border bg-bg-surface p-4">
              <p className="mb-3 text-sm text-ink-muted">{result.summary}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-faint">Before</p>
                  <div className="flex items-center gap-1.5 text-sm text-ink">
                    <Clock size={13} className="text-danger" /> {result.before.timeComplexity}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                    <Database size={13} className="text-danger" /> {result.before.spaceComplexity}
                  </div>
                </div>
                <div className="rounded-lg border border-mint/30 bg-mint-dim/20 p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-mint">After</p>
                  <div className="flex items-center gap-1.5 text-sm text-ink">
                    <Clock size={13} className="text-mint" /> {result.after.timeComplexity}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                    <Database size={13} className="text-mint" /> {result.after.spaceComplexity}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Optimized code</p>
              <button
                onClick={() => copyToClipboard(result.after.code, "Optimized code")}
                className="focus-ring flex items-center gap-1.5 rounded-md border border-border bg-bg-raised px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink"
              >
                <Copy size={12} /> Copy optimized code
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <CodeEditor
                value={result.after.code}
                onChange={() => {}}
                language={MONACO_LANG_MAP[language]}
                height="280px"
                readOnly
              />
            </div>

            {result.changes.length > 0 && (
              <div className="space-y-2.5">
                {result.changes.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border bg-bg-surface p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLE[c.type]}`}>
                        {c.type}
                      </span>
                      <span className="text-sm font-medium text-ink">{c.title}</span>
                    </div>
                    <p className="text-sm text-ink-muted">{c.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}