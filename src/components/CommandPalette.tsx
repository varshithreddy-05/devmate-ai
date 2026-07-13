"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, FileCode2, Gauge, ArrowLeftRight, Braces, Command } from "lucide-react";

const ITEMS = [
  { label: "AI Code Review", href: "/tools/code-review", icon: FileCode2, hint: "Find bugs & vulnerabilities" },
  { label: "AI Code Optimization", href: "/tools/code-optimize", icon: Gauge, hint: "Cut complexity" },
  { label: "AI Code Converter", href: "/tools/code-convert", icon: ArrowLeftRight, hint: "Translate languages" },
  { label: "Concept Detector", href: "/tools/concept-detector", icon: Braces, hint: "List every concept used" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="focus-ring group flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent/40"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Quick jump</span>
        <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-border bg-bg-raised px-1.5 py-0.5 text-[10px] text-ink-faint sm:flex">
          <Command size={10} />K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[18%] z-50 w-[92vw] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg-raised shadow-2xl"
            >
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Search size={16} className="text-ink-faint" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Jump to a tool..."
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
                />
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-ink-faint">No matches.</p>
                )}
                {filtered.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      router.push(item.href);
                    }}
                    className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-bg-surface"
                  >
                    <item.icon size={16} className="text-accent" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-xs text-ink-faint">{item.hint}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
