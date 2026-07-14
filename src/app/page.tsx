"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  FileCode2,
  Gauge,
  ArrowLeftRight,
  Braces,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { DiffHero } from "@/components/DiffHero";

type Tool = {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  status: "live" | "scaffold";
};

const TOOLS: Tool[] = [
  {
    href: "/tools/code-review",
    icon: FileCode2,
    title: "AI Code Review",
    desc: "Bugs, vulnerabilities, bad practices, and code smells — each with severity and a corrected version.",
    status: "live",
  },
  {
    href: "/tools/code-optimize",
    icon: Gauge,
    title: "AI Code Optimization",
    desc: "Runtime and memory improvements, with before/after time & space complexity.",
    status: "live" as const,
  },
  {
    href: "/tools/code-convert",
    icon: ArrowLeftRight,
    title: "AI Code Converter",
    desc: "Translate code between languages — C++, Python, Java, Go, Rust and more.",
    status: "live" as const,
  },
  {
    href: "/tools/concept-detector",
    icon: Braces,
    title: "Concept Detector",
    desc: "Every data structure, algorithm and pattern used in your code, made clickable.",
    status: "live" as const,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-display text-lg tracking-tight">DevMate AI</span>
          </div>
          <div className="flex items-center gap-3">
            <CommandPalette />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        <motion.div initial="hidden" animate="show" variants={container}>
          <motion.span
            variants={item}
            className="mb-5 inline-block rounded-full border border-accent/30 bg-accent-dim px-3 py-1 text-xs font-medium text-accent"
          >
            Powered by Groq
          </motion.span>
          <motion.h1
            variants={item}
            className="font-display text-5xl leading-[1.05] tracking-tight lg:text-6xl"
          >
            Paste code.
            <br />
            Get a second opinion.
          </motion.h1>
          <motion.p variants={item} className="mt-5 max-w-md text-lg text-ink-muted">
            Review, optimize, convert, and dissect any codebase with an AI that explains
            every decision — not just what to change, but why.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex items-center gap-3">
            <Link
              href="/tools/code-review"
              className="focus-ring group flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Start reviewing
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="font-mono text-xs text-ink-faint">no signup required for demo</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <DiffHero />
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
          className="grid gap-4 sm:grid-cols-2"
        >
          {TOOLS.map((tool) => (
            <motion.div key={tool.href} variants={item}>
              <Link
                href={tool.href}
                className="focus-ring group flex h-full flex-col rounded-xl border border-border bg-bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-dim">
                    <tool.icon size={18} className="text-accent" />
                  </div>
                  {tool.status === "scaffold" && (
                    <span className="rounded-full bg-amber-dim px-2 py-0.5 text-[10px] font-medium text-amber">
                      Scaffolded
                    </span>
                  )}
                </div>
                <h3 className="mb-1.5 font-medium text-ink">{tool.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{tool.desc}</p>
                <span className="mt-4 flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
