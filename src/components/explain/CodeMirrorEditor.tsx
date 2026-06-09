"use client";
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, type Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { sql } from "@codemirror/lang-sql";
import { php } from "@codemirror/lang-php";
import { cpp } from "@codemirror/lang-cpp";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";
import { placeholder as placeholderExt } from "@codemirror/view";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: string;
}

// Maps a detected language name (from CODE_FILE_EXTENSIONS) to a CodeMirror
// grammar. Returns null for languages without an official CM6 package so the
// caller can fall back to its default.
function languageExtension(language?: string): Extension | null {
  switch ((language ?? "").toLowerCase()) {
    case "javascript":
      return javascript();
    case "typescript":
      return javascript({ typescript: true });
    case "python":
      return python();
    case "java":
      return java();
    case "rust":
      return rust();
    case "go":
      return go();
    case "sql":
      return sql();
    case "php":
      return php();
    case "c":
    case "cpp":
      return cpp();
    case "json":
      return json();
    case "markdown":
      return markdown();
    case "html":
      return html();
    case "css":
      return css();
    default:
      return null;
  }
}

export default function CodeMirrorEditor({ value, onChange, placeholder, language }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!editorRef.current) return;

    const langExt = languageExtension(language);

    const extensions = [
      basicSetup,
      // When a language is known, use just that grammar. Otherwise keep the
      // original JS/TS + Python defaults so existing modes are unchanged.
      ...(langExt ? [langExt] : [javascript({ typescript: true }), python()]),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
    ];

    if (placeholder) {
      extensions.push(placeholderExt(placeholder));
    }

    if (resolvedTheme === "dark") {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // Re-create on theme or language change, not on every value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, language]);

  // Sync external value changes without re-creating editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="min-h-[200px] max-h-[400px] overflow-auto rounded-t-lg text-sm"
    />
  );
}
