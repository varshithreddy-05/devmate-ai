"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Play, Loader2, ArrowRight, Copy, Check } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  detectLanguage,
  MONACO_LANG_MAP,
  SUPPORTED_LANGUAGES,
  type DetectedLanguage,
} from "@/lib/detectLanguage";
import { useAppStore } from "@/store/useAppStore";

interface Note {
  title: string;
  explanation: string;
}
interface ConvertResult {
  sourceLanguage: string;
  targetLanguage: string;
  convertedCode: string;
  notes: Note[];
}

const EXAMPLE = `def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`;

export default function CodeConvertPage() {
  const [code, setCode] = useState(EXAMPLE);
  const [sourceLang, setSourceLang] = useState<DetectedLanguage>(detectLanguage(EXAMPLE));
  const [overrideLang, setOverrideLang] = useState(false);
  const [targetLang, setTargetLang] = useState<DetectedLanguage>("javascript");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [copied, setCopied] = useState(false);
  const addHistoryItem = useAppStore((s) => s.addHistoryItem);

  function handleCodeChange(v: string) {
    setCode(v);
    if (!overrideLang) setSourceLang(detectLanguage(v));
  }

  async function runConvert() {
    if (!code.trim()) {
      toast.error("Paste or upload some code first.");
      return;
    }
    if (sourceLang === targetLang) {
      toast.error("Source and target languages are the same.");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, sourceLanguage: sourceLang, targetLanguage: targetLang }),
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
      const parsed: ConvertResult | { error: string } = JSON.parse(cleaned);
      if ("error" in parsed) throw new Error(parsed.error);

      setResult(parsed);
      addHistoryItem({
        id: crypto.randomUUID(),
        tool: "code-convert",
        language: sourceLang,
        targetLanguage: targetLang,
        codeSnippet: code.slice(0, 200),
        createdAt: Date.now(),
        pinned: false,
        favorite: false,
      });
      toast.success(`Converted ${sourceLang} → ${targetLang}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(result.convertedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="focus-ring flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="font-display text-xl">AI Code Converter</h1>
          <ThemeToggle />
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-bg-surface px-2.5 py-1 font-mono text-xs text-ink-muted">
              {overrideLang ? "manual" : "auto"}: {sourceLang}
            </span>
            <select
              value={sourceLang}
              onChange={(e) => {
                setOverrideLang(true);
                setSourceLang(e.target.value as DetectedLanguage);
              }}
              className="focus-ring rounded-md border border-border bg-bg-surface px-2 py-1 text-xs text-ink"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <ArrowRight size={14} className="text-ink-faint" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as DetectedLanguage)}
              className="focus-ring rounded-md border border-accent/40 bg-accent-dim px-2 py-1 text-xs font-medium text-accent"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <button
            onClick={runConvert}
            disabled={loading}
            className="focus-ring flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? "Converting..." : "Convert"}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Source · {sourceLang}</p>
            <CodeEditor value={code} onChange={handleCodeChange} language={MONACO_LANG_MAP[sourceLang]} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Result · {targetLang}</p>
              {result && (
                <button
                  onClick={copyResult}
                  className="focus-ring flex items-center gap-1.5 rounded-md border border-border bg-bg-surface px-2 py-1 text-xs text-ink-muted hover:text-ink"
                >
                  {copied ? <Check size={12} className="text-mint" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            {!result && !loading && (
              <div className="flex h-[480px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
                <p className="text-sm text-ink-muted">Converted code will appear here.</p>
              </div>
            )}
            {loading && (
              <div className="flex h-[480px] items-center justify-center rounded-xl border border-border bg-bg-surface">
                <Loader2 size={20} className="animate-spin text-ink-faint" />
              </div>
            )}
            {result && (
              <CodeEditor
                value={result.convertedCode}
                onChange={() => {}}
                language={MONACO_LANG_MAP[targetLang]}
                readOnly
              />
            )}
          </div>
        </div>

        {result && result.notes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Translation notes</p>
            {result.notes.map((n, i) => (
              <div key={i} className="rounded-xl border border-border bg-bg-surface p-4">
                <p className="mb-1 text-sm font-medium text-ink">{n.title}</p>
                <p className="text-sm text-ink-muted">{n.explanation}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
}
