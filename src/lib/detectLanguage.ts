export type DetectedLanguage =
  | "python"
  | "cpp"
  | "java"
  | "javascript"
  | "typescript"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "csharp"
  | "sql"
  | "html"
  | "css"
  | "shell"
  | "unknown";

// Lightweight heuristic detector: fast, runs client-side instantly for the
// Monaco editor's language mode, before the AI call confirms/refines it.
// Order matters — more specific / less ambiguous signals are checked first.
const RULES: Array<{ lang: DetectedLanguage; test: RegExp }> = [
  { lang: "html", test: /<\/?(html|div|span|body|head)[\s>]/i },
  { lang: "css", test: /^[ \t]*[a-zA-Z-]+\s*:\s*[^;{}:\n]+;[ \t]*$/m },
  { lang: "python", test: /^\s*(def\s|from\s+\S+\s+import\s|import\s+[^\n;]+$|class\s+\w+(\(.*\))?\s*:\s*$|print\()/m },
  { lang: "rust", test: /\bfn\s+\w+\s*\(|let mut |->\s*\w+\s*\{|::<|impl\s+\w+/ },
  { lang: "go", test: /\bfunc\s+\w+\s*\(|package main|:=|\bfmt\.(Println|Printf)/ },
  { lang: "kotlin", test: /\bfun\s+\w+\s*\(|val\s+\w+\s*[:=]|\bcompanion object\b/ },
  { lang: "swift", test: /\bfunc\s+\w+\(.*\)\s*->|\bvar\s+\w+:\s*\w+|import UIKit|import SwiftUI/ },
  { lang: "csharp", test: /\busing System;|namespace\s+\w+|Console\.(WriteLine|Write)\(/ },
  { lang: "php", test: /^<\?php|\$[a-zA-Z_]\w*\s*=/m },
  { lang: "ruby", test: /\bdef\s+\w+.*\n(.|\n)*?\bend\b|\bputs\s|\battr_accessor\b/ },
  { lang: "sql", test: /\b(SELECT|INSERT INTO|CREATE TABLE|UPDATE .+ SET)\b/i },
  { lang: "shell", test: /^#!\/bin\/(bash|sh)|^\s*(sudo |apt-get |echo \$)/m },
  { lang: "cpp", test: /#include\s*<\w+>|std::|cout\s*<<|int main\s*\(/ },
  { lang: "typescript", test: /:\s*(string|number|boolean|any|void)\b|interface\s+\w+|<.+>\(.*\):\s*\w+/ },
  { lang: "java", test: /\bpublic\s+(static\s+)?(class|void)\b|\bSystem\.out\.println\(/ },
  { lang: "javascript", test: /\bconst\s|\blet\s|function\s+\w*\(|=>\s*\{|console\.log\(/ },
];

export function detectLanguage(code: string): DetectedLanguage {
  if (!code || !code.trim()) return "unknown";
  for (const rule of RULES) {
    if (rule.test.test(code)) return rule.lang;
  }
  return "unknown";
}

// Maps our detected language ids to Monaco's language ids (mostly identical).
export const MONACO_LANG_MAP: Record<DetectedLanguage, string> = {
  python: "python",
  cpp: "cpp",
  java: "java",
  javascript: "javascript",
  typescript: "typescript",
  go: "go",
  rust: "rust",
  php: "php",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  csharp: "csharp",
  sql: "sql",
  html: "html",
  css: "css",
  shell: "shell",
  unknown: "plaintext",
};

export const SUPPORTED_LANGUAGES: DetectedLanguage[] = [
  "python", "cpp", "java", "javascript", "typescript", "go", "rust",
  "php", "ruby", "swift", "kotlin", "csharp", "sql", "html", "css", "shell",
];
