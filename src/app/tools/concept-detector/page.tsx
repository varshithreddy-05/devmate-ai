"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Play, Loader2, Braces, ChevronDown } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  detectLanguage,
  MONACO_LANG_MAP,
  SUPPORTED_LANGUAGES,
  type DetectedLanguage,
} from "@/lib/detectLanguage";
import { useAppStore } from "@/store/useAppStore";

interface Concept {
  id: string;
  name: string;
  category: "data-structure" | "algorithm" | "paradigm" | "language-feature" | "pattern";
  whyUsed: string;
  complexity: string;
  interviewImportance: "high" | "medium" | "low";
  relatedConcepts: string[];
  commonMistakes: string;
}
interface ConceptResult {
  language: string;
  concepts: Concept[];
}

const IMPORTANCE_STYLE: Record<string, string> = {
  high: "bg-danger-dim text-danger",
  medium: "bg-amber-dim text-amber",
  low: "bg-mint-dim text-mint",
};

const CATEGORY_STYLE: Record<string, string> = {
  "data-structure": "border-accent/40 text-accent",
  algorithm: "border-mint/40 text-mint",
  paradigm: "border-amber/40 text-amber",
  "language-feature": "border-border text-ink-muted",
  pattern: "border-danger/40 text-danger",
};

const EXAMPLE = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def dfs(node, target):
    if not node:
        return False
    if node.val == target:
        return True
    return dfs(node.left, target) or dfs(node.right, target)`;

export default function ConceptDetectorPage() {
  const [code, setCode] = useState(EXAMPLE);
  const [language, setLanguage] = useState<DetectedLanguage>(detectLanguage(EXAMPLE));
  const [overrideLang, setOverrideLang] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConceptResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const addHistoryItem = useAppStore((s) => s.addHistoryItem);

  function handleCodeChange(v: string) {
    setCode(v);
    if (!overrideLang) setLanguage(detectLanguage(v));
  }

  async function runDetect() {
    if (!code.trim()) {
      toast.error("Paste or upload some code first.");
      return;
    }
    setLoading(true);
    setResult(null);
    setExpanded(null);

    try {
      const res = await fetch("/api/concepts", {
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
      const parsed: ConceptResult | { error: string } = JSON.parse(cleaned);
      if ("error" in parsed) throw new Error(parsed.error);

      setResult(parsed);
      addHistoryItem({
        id: crypto.randomUUID(),
        tool: "concept-detector",
        language,
        codeSnippet: code.slice(0, 200),
        createdAt: Date.now(),
        pinned: false,
        favorite: false,
      });
      toast.success(`Detected ${parsed.concepts.length} concept(s).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Detection failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="focus-ring flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="font-display text-xl">Concept Detector</h1>
          <ThemeToggle />
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-bg-surface px-2.5 py-1 font-mono text-xs text-ink-muted">
                {overrideLang ? "manual" : "auto-detected"}: {language}
              </span>
              <select
                value={language}
                onChange={(e) => {
                  setOverrideLang(true);
                  setLanguage(e.target.value as DetectedLanguage);
                }}
                className="focus-ring rounded-md border border-border bg-bg-surface px-2 py-1 text-xs text-ink"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <button
              onClick={runDetect}
              disabled={loading}
              className="focus-ring flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              {loading ? "Analyzing..." : "Detect concepts"}
            </button>
          </div>
          <CodeEditor value={code} onChange={handleCodeChange} language={MONACO_LANG_MAP[language]} />
        </div>

        <div className="flex flex-col gap-3">
          {!result && !loading && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
              <Braces size={22} className="mb-3 text-ink-faint" />
              <p className="text-sm text-ink-muted">
                Every concept your code demonstrates will show up here as clickable chips.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded-full border border-border bg-bg-surface" />
              ))}
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {result.concepts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${CATEGORY_STYLE[c.category]} ${
                      expanded === c.id ? "bg-bg-raised" : "bg-bg-surface hover:bg-bg-raised"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {expanded && (() => {
                  const c = result.concepts.find((x) => x.id === expanded);
                  if (!c) return null;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-border bg-bg-surface p-5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-medium text-ink">{c.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${IMPORTANCE_STYLE[c.interviewImportance]}`}>
                          {c.interviewImportance} interview relevance
                        </span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <p><span className="font-medium text-ink">Why it's here: </span><span className="text-ink-muted">{c.whyUsed}</span></p>
                        <p><span className="font-medium text-ink">Complexity: </span><span className="font-mono text-ink-muted">{c.complexity}</span></p>
                        <p><span className="font-medium text-ink">Common mistake: </span><span className="text-ink-muted">{c.commonMistakes}</span></p>
                        {c.relatedConcepts.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="font-medium text-ink">Related:</span>
                            {c.relatedConcepts.map((r) => (
                              <span key={r} className="rounded-full bg-bg-raised px-2 py-0.5 text-xs text-ink-muted">{r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setExpanded(null)}
                        className="focus-ring mt-4 flex items-center gap-1 text-xs text-ink-faint hover:text-ink"
                      >
                        <ChevronDown size={12} className="rotate-180" /> Collapse
                      </button>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
