"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Play,
  Loader2,
  ChevronDown,
  ShieldAlert,
  Bug,
  Sparkles as SparklesIcon,
  AlertTriangle,
  Wand2,
  CheckCircle2,
  Terminal,
  Copy,
} from "lucide-react";
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

interface Issue {
  id: string;
  title: string;
  category: "bug" | "vulnerability" | "bad-practice" | "code-smell";
  severity: "critical" | "high" | "medium" | "low";
  line: number | null;
  explanation: string;
  suggestion: string;
  before: string;
  after: string;
}
interface ReviewResult {
  language: string;
  summary: string;
  overallSeverity: string;
  issues: Issue[];
}

const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-danger-dim text-danger",
  high: "bg-danger-dim text-danger",
  medium: "bg-amber-dim text-amber",
  low: "bg-mint-dim text-mint",
  clean: "bg-mint-dim text-mint",
};

const CATEGORY_ICON: Record<string, typeof Bug> = {
  bug: Bug,
  vulnerability: ShieldAlert,
  "bad-practice": AlertTriangle,
  "code-smell": AlertTriangle,
};

// Shared clipboard helper — used by the "Copy fixed code" button and the
// per-issue snippet copy buttons below.
async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard.`);
  } catch {
    toast.error("Couldn't copy — clipboard access is blocked in this browser.");
  }
}

export default function CodeReviewPage() {
  // Code + detected language live in the shared store (not local useState)
  // so they survive switching to another tool page and back — local state
  // was getting wiped every time this page unmounted on navigation.
  const code = useAppStore((s) => s.currentCode);
  const setCode = useAppStore((s) => s.setCurrentCode);
  const language = useAppStore((s) => s.currentLanguage);
  const setLanguage = useAppStore((s) => s.setCurrentLanguage);

  const [overrideLang, setOverrideLang] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [rawStream, setRawStream] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const addHistoryItem = useAppStore((s) => s.addHistoryItem);

  function handleCodeChange(v: string) {
    setCode(v);
    if (!overrideLang) setLanguage(detectLanguage(v));
  }

  function applyFix(issue: Issue) {
    if (!code.includes(issue.before)) {
      toast.error("Couldn't auto-apply — the original snippet has changed. Edit manually.");
      return;
    }
    setCode(code.replace(issue.before, issue.after));
    toast.success(`Applied fix: ${issue.title}`);
  }

  // Pure computation of "current code with every applicable fix applied" —
  // shared by applyAllFixes (which mutates the editor) and the copy button
  // (which shouldn't mutate anything, just read the result).
  function getFixedCode(): string {
    if (!result) return code;
    let updated = code;
    for (const issue of result.issues) {
      if (updated.includes(issue.before)) {
        updated = updated.replace(issue.before, issue.after);
      }
    }
    return updated;
  }

  function applyAllFixes() {
    if (!result) return;
    let updated = code;
    let appliedCount = 0;
    for (const issue of result.issues) {
      if (updated.includes(issue.before)) {
        updated = updated.replace(issue.before, issue.after);
        appliedCount++;
      }
    }
    setCode(updated);
    toast.success(`Applied ${appliedCount} of ${result.issues.length} fix(es).`);
  }

  // Placeholder for real sandboxed execution (Judge0/Piston-style API) — wiring that up
  // is a separate feature (needs its own API key + service). For now this confirms the
  // code is clean and gives an honest "not wired up yet" message instead of faking output.
  function runCompile() {
    setCompiling(true);
    setTimeout(() => {
      setCompiling(false);
      toast.success("No issues detected. Real sandboxed execution isn't wired up yet — coming in a future update.");
    }, 700);
  }

  async function runReview() {
    if (!code.trim()) {
      toast.error("Paste or upload some code first.");
      return;
    }
    setLoading(true);
    setResult(null);
    setRawStream("");

    try {
      const res = await fetch("/api/analyze", {
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
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setRawStream(full);
      }

      const cleaned = full.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
      const parsed: ReviewResult | { error: string } = JSON.parse(cleaned);

      if ("error" in parsed) throw new Error(parsed.error);
      setResult(parsed);

      addHistoryItem({
        id: crypto.randomUUID(),
        tool: "code-review",
        language,
        codeSnippet: code.slice(0, 200),
        createdAt: Date.now(),
        pinned: false,
        favorite: false,
      });
      toast.success(
        parsed.issues.length ? `Found ${parsed.issues.length} issue(s).` : "No issues found — clean code."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed. Check your GROQ_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-2">
      {/* Left: editor */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
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
          <button
            onClick={runReview}
            disabled={loading}
            className="focus-ring flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? "Analyzing..." : "Run review"}
          </button>
        </div>
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          language={MONACO_LANG_MAP[language]}
          placeholder="Paste your code here to check for bugs, vulnerabilities, and bad practices..."
        />
      </div>

      {/* Right: results */}
      <div className="flex flex-col gap-3">
        {!result && !loading && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
            <SparklesIcon size={22} className="mb-3 text-ink-faint" />
            <p className="text-sm text-ink-muted">
              Run a review to see bugs, vulnerabilities, and suggested fixes here.
            </p>
          </div>
        )}

        {loading && !result && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-bg-surface p-4">
                <div className="mb-2 h-3 w-1/3 rounded bg-bg-raised" />
                <div className="h-3 w-2/3 rounded bg-bg-raised" />
              </div>
            ))}
            <p className="font-mono text-[11px] text-ink-faint">{rawStream.length} chars streamed…</p>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className={`rounded-xl border p-4 ${result.issues.length === 0 ? "border-mint/30 bg-mint-dim/20" : "border-border bg-bg-surface"}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {result.issues.length === 0 ? (
                    <CheckCircle2 size={16} className="text-mint" />
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${SEVERITY_STYLE[result.overallSeverity] ?? SEVERITY_STYLE.low}`}>
                      {result.overallSeverity}
                    </span>
                  )}
                  <span className="text-xs text-ink-faint">{result.issues.length} issue(s)</span>
                </div>
                {result.issues.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(getFixedCode(), "Fixed code")}
                      className="focus-ring flex items-center gap-1.5 rounded-md border border-border bg-bg-raised px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink"
                    >
                      <Copy size={12} /> Copy fixed code
                    </button>
                    <button
                      onClick={applyAllFixes}
                      className="focus-ring flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent-dim px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20"
                    >
                      <Wand2 size={12} /> Fix all
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={runCompile}
                    disabled={compiling}
                    className="focus-ring flex items-center gap-1.5 rounded-md border border-mint/40 bg-mint-dim px-2.5 py-1 text-xs font-medium text-mint hover:bg-mint/20 disabled:opacity-60"
                  >
                    {compiling ? <Loader2 size={12} className="animate-spin" /> : <Terminal size={12} />}
                    {compiling ? "Compiling..." : "Compile & Run"}
                  </button>
                )}
              </div>
              <p className="text-sm text-ink-muted">{result.summary}</p>
            </div>

            <div className="space-y-2.5">
              {result.issues.map((issue) => {
                const Icon = CATEGORY_ICON[issue.category] ?? Bug;
                const isOpen = expanded === issue.id;
                return (
                  <div key={issue.id} className="overflow-hidden rounded-xl border border-border bg-bg-surface">
                    <button
                      onClick={() => setExpanded(isOpen ? null : issue.id)}
                      className="focus-ring flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <Icon size={16} className="shrink-0 text-ink-muted" />
                      <span className="flex-1 text-sm font-medium text-ink">{issue.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SEVERITY_STYLE[issue.severity]}`}>
                        {issue.severity}
                      </span>
                      {issue.line && <span className="font-mono text-[11px] text-ink-faint">L{issue.line}</span>}
                      <ChevronDown size={15} className={`text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="border-t border-border px-4 py-3 text-sm"
                        >
                          <p className="mb-3 text-ink-muted">{issue.explanation}</p>
                          <p className="mb-3 text-ink-muted"><span className="font-medium text-ink">Fix: </span>{issue.suggestion}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <pre className="overflow-x-auto rounded-lg border-l-2 border-danger bg-danger-dim/30 p-3 font-mono text-xs text-ink-muted">{issue.before}</pre>
                            <div className="relative">
                              <button
                                onClick={() => copyToClipboard(issue.after, "Corrected snippet")}
                                className="focus-ring absolute right-2 top-2 rounded-md border border-border bg-bg-raised p-1 text-ink-faint hover:text-ink"
                                aria-label="Copy corrected snippet"
                                title="Copy corrected snippet"
                              >
                                <Copy size={12} />
                              </button>
                              <pre className="overflow-x-auto rounded-lg border-l-2 border-mint bg-mint-dim/30 p-3 pr-8 font-mono text-xs text-ink">{issue.after}</pre>
                            </div>
                          </div>
                          <button
                            onClick={() => applyFix(issue)}
                            className="focus-ring mt-3 flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent-dim px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20"
                          >
                            <Wand2 size={12} /> Apply this fix
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}