"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

interface LanguageSelectOption {
  value: string;
  label: string;
}

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: LanguageSelectOption[];
  variant?: "default" | "accent";
}

// Custom dropdown replacing native <select> so the open/close transition can
// actually be animated — native <select> popovers are rendered by the
// browser/OS and can't be touched by CSS or JS animation libraries.
export function LanguageSelect({ value, onChange, options, variant = "default" }: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const triggerStyle =
    variant === "accent"
      ? "border-accent/40 bg-accent-dim text-accent"
      : "border-border bg-bg-surface text-ink";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`focus-ring flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${triggerStyle}`}
      >
        {current?.label ?? value}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-[calc(100%+6px)] z-40 max-h-64 w-40 overflow-y-auto rounded-lg border border-border bg-bg-raised p-1 shadow-xl"
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`focus-ring flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs ${
                    active ? "bg-accent-dim text-accent" : "text-ink-muted hover:bg-bg-surface hover:text-ink"
                  }`}
                >
                  {opt.label}
                  {active && <Check size={12} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}