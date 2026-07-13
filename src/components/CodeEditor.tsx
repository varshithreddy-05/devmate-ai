"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  readOnly?: boolean;
  placeholder?: string;
}

// Thin wrapper around Monaco so every tool page (review/optimize/convert/
// concept-detector) shares one configured editor instance instead of
// re-deriving options each time.
export function CodeEditor({
  value,
  onChange,
  language,
  height = "480px",
  readOnly,
  placeholder,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  // Tracks whether Monaco has actually finished mounting. Used to fade the
  // editor in instead of letting it snap in the instant it's ready — that
  // instant swap from skeleton -> full editor is what read as "laggy".
  const [ready, setReady] = useState(false);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    setReady(true);

    // Monaco's built-in paste handling can occasionally treat a paste as a
    // sequence of individual keystrokes rather than one bulk insert. When that
    // happens, auto-indent and auto-closing-bracket rules fire per character,
    // which mangles the pasted code (lines splitting oddly, indentation jumping
    // around). Intercepting the native paste event and inserting the clipboard
    // text as a single raw edit operation bypasses that pipeline entirely, so
    // paste always inserts exactly what's on the clipboard.
    const domNode = editor.getDomNode();
    if (domNode) {
      domNode.addEventListener(
        "paste",
        (e: ClipboardEvent) => {
          const text = e.clipboardData?.getData("text/plain");
          if (text == null) return;
          e.preventDefault();
          e.stopPropagation();

          const model = editor.getModel();
          const selection = editor.getSelection();
          if (!model || !selection) return;

          editor.executeEdits("paste", [
            {
              range: selection,
              text,
              forceMoveMarkers: true,
            },
          ]);
          editor.pushUndoStop();
        },
        true // capture phase — intercept before Monaco's own paste handler runs
      );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      {placeholder && !value && (
        <div className="pointer-events-none absolute left-[66px] top-[15px] right-6 z-10 select-none whitespace-pre-line font-mono text-[13px] leading-[19px] text-ink-faint">
          {placeholder}
        </div>
      )}
      <motion.div
        initial={false}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          onMount={handleMount}
          theme={resolvedTheme === "light" ? "light" : "vs-dark"}
          // Replaces Monaco's default "Loading editor..." flash with a
          // skeleton that matches the rest of the app's loading states
          // (see the pulse skeletons in the results panels) so the editor
          // reads as "still loading" instead of popping in unstyled.
          loading={
            <div className="flex w-full flex-col gap-2.5 p-4" style={{ height }}>
              {[92, 78, 85, 60, 70, 45, 88, 55].map((w, i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse rounded bg-bg-raised"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          }
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
          formatOnPaste: false,
          automaticLayout: true,
          renderLineHighlight: value ? "line" : "none",
        }}
        />
      </motion.div>
    </div>
  );
}