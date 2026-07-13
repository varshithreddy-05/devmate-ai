"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useRef } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  readOnly?: boolean;
}

// Thin wrapper around Monaco so every tool page (review/optimize/convert/
// concept-detector) shares one configured editor instance instead of
// re-deriving options each time.
export function CodeEditor({ value, onChange, language, height = "480px", readOnly }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        theme={resolvedTheme === "light" ? "light" : "vs-dark"}
        options={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          minimap: { enabled: true },
          lineNumbers: "on",
          readOnly,
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          formatOnPaste: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
