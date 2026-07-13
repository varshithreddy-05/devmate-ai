"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FileCode2, Gauge, ArrowLeftRight, Braces } from "lucide-react";

const TOOLS = [
  { href: "/tools/code-review", label: "Review", icon: FileCode2 },
  { href: "/tools/code-optimize", label: "Optimize", icon: Gauge },
  { href: "/tools/code-convert", label: "Convert", icon: ArrowLeftRight },
  { href: "/tools/concept-detector", label: "Concepts", icon: Braces },
];

export function ToolsNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-surface p-1">
      {TOOLS.map((tool) => {
        const active = pathname === tool.href;
        return (
          <Link
            key={tool.href}
            href={tool.href}
            className={`focus-ring relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active ? "text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            {active && (
              <motion.div
                layoutId="tools-nav-pill"
                className="absolute inset-0 rounded-md bg-accent"
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              />
            )}
            <tool.icon size={13} className="relative z-10" />
            <span className="relative z-10 hidden sm:inline">{tool.label}</span>
          </Link>
        );
      })}
    </div>
  );
}