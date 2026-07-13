"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Play, Loader2, ArrowRight, Copy, Check } from "lucide-react";
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

export default function CodeConvertPage() {
  // Source code + detected language live in the shared store (not local
  // useState) so they survive switching to another tool page and back.
  // targetLang stays local — it's a per-visit choice, not "the code".
  const code = useAppStore((s) => s.currentCode);
  const setCode = useAppStore((s) => s.setCurrentCode);
  const sourceLang = useAppStore((s) => s.currentLanguage);
  const setSourceLang = useAppStore((s) => s.setCurrentLanguage);

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
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
            <LanguageSelect
              value={overrideLang ? sourceLang : "auto"}
              onChange={(v) => {
                if (v === "auto") {
                  setOverrideLang(false);
                  setSourceLang(detectLanguage(code));
                } else {
                  setOverrideLang(true);
                  setSourceLang(v as DetectedLanguage);
                }
              }}
              options={[
                { value: "auto", label: "Auto Detect" },
                ...SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: l })),
              ]}
            />
            <ArrowRight size={14} className="text-ink-faint" />
            <LanguageSelect
              value={targetLang}
              onChange={(v) => setTargetLang(v as DetectedLanguage)}
              options={SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: l }))}
              variant="accent"
            />
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
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            language={MONACO_LANG_MAP[sourceLang]}
            placeholder="Paste the code you want to convert..."
          />
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
                {copied ? "Copied" : `Copy ${targetLang} code`}
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
  );
}