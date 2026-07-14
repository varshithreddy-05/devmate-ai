"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
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
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  // Tracks whether Monaco has actually finished mounting. Used to fade the
  // editor in instead of letting it snap in the instant it's ready.
  const [ready, setReady] = useState(false);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
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

  // Switching the language mode (e.g. toggling "Auto Detect") used to wipe
  // the editor's content. That happened because passing `language` as a
  // *live* prop to <Editor> makes @monaco-editor/react rebuild the
  // underlying text model whenever it changes, and that rebuild doesn't
  // reliably carry over the current text. Calling setModelLanguage directly
  // on the existing model instead only repaints the syntax highlighting —
  // it can never touch the model's content.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (editor && monaco && model && language) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [language]);

  // Same idea for external value changes (e.g. "Apply fix", "Fix all", or
  // the store's persisted code loading in after hydration): push the new
  // text into the existing model imperatively instead of letting the
  // editor's `value` prop drive a model rebuild. The equality check stops
  // this from firing (and resetting cursor position) on every keystroke —
  // it only runs when the text actually changed from outside the editor.
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && value !== editor.getValue()) {
      editor.setValue(value);
    }
  }, [value]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      {placeholder && !value && (
        <div className="pointer-events-none absolute left-[65px] top-[16px] right-4 z-10 select-none whitespace-pre-line font-mono text-[13px] leading-[19px] text-ink-faint">
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
          // defaultLanguage/defaultValue seed the editor once at creation.
          // Updates after that go through the two effects above instead of
          // through Monaco's own (buggy) reactive language/value handling.
          defaultLanguage={language}
          defaultValue={value}
          onChange={(v) => onChange(v ?? "")}
          onMount={handleMount}
          theme={resolvedTheme === "light" ? "light" : "vs-dark"}
          // Replaces Monaco's default "Loading editor..." flash with a
          // skeleton that matches the rest of the app's loading states.
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
          }}
        />
      </motion.div>
    </div>
  );
} 