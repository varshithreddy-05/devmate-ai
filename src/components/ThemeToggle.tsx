"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-[108px]" />;

  return (
    <div className="relative flex items-center gap-0.5 rounded-full border border-border bg-bg-surface p-1 dark:border-border dark:bg-bg-surface">
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            aria-label={`${opt.label} theme`}
            className="focus-ring relative flex h-7 w-7 items-center justify-center rounded-full"
          >
            {active && (
              <motion.div
                layoutId="theme-pill"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              />
            )}
            <opt.icon
              size={14}
              className={`relative z-10 ${active ? "text-white" : "text-ink-muted"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
