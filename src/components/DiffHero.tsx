"use client";

import { motion } from "framer-motion";

// The signature element: a code block that visibly rewrites itself,
// line by line, from a flawed version into a reviewed/optimized one —
// literally dramatizing what the product does, on the page that sells it.
const LINES = [
  { type: "ctx", text: "def get_user(id):" },
  { type: "del", text: "    return db.query(\"SELECT * FROM users WHERE id=\" + id)" },
  { type: "add", text: "    return db.query(\"SELECT * FROM users WHERE id = %s\", (id,))" },
  { type: "ctx", text: "" },
  { type: "del", text: "    for i in range(len(items)):" },
  { type: "del", text: "        total += items[i].price" },
  { type: "add", text: "    total = sum(item.price for item in items)" },
  { type: "ctx", text: "    return total" },
];

export function DiffHero() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-bg-raised shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border bg-bg-surface px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-mint/60" />
        </div>
        <span className="ml-2 font-mono text-xs text-ink-faint">user_service.py — AI Review</span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-danger-dim px-2 py-0.5 text-[11px] font-medium text-danger">
          2 issues found
        </span>
      </div>
      <div className="p-4 font-mono text-[13px] leading-relaxed">
        {LINES.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.35, ease: "easeOut" }}
            className={
              line.type === "del"
                ? "border-l-2 border-danger bg-danger-dim/40 px-3 py-0.5 text-ink-faint line-through decoration-danger/70"
                : line.type === "add"
                ? "border-l-2 border-mint bg-mint-dim/40 px-3 py-0.5 text-ink"
                : "border-l-2 border-transparent px-3 py-0.5 text-ink-muted"
            }
          >
            <span className="select-none pr-3 text-ink-faint">
              {line.type === "del" ? "−" : line.type === "add" ? "+" : "\u00A0"}
            </span>
            {line.text || "\u00A0"}
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        className="flex flex-wrap gap-2 border-t border-border bg-bg-surface px-4 py-3"
      >
        <span className="rounded-full bg-danger-dim px-2.5 py-1 text-[11px] font-medium text-danger">
          SQL Injection · High
        </span>
        <span className="rounded-full bg-amber-dim px-2.5 py-1 text-[11px] font-medium text-amber">
          O(n) → O(n) cleaner · Readability
        </span>
      </motion.div>
    </div>
  );
}
