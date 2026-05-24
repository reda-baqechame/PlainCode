"use client";
import { useState } from "react";
import { Copy, Check, Download, FileCode2, FilePlus2 } from "lucide-react";
import {
  exportDocumentMarkdown,
  exportDocstrings,
  injectDocstrings,
  type DocumentExportData,
} from "@/lib/utils/export-markdown";

interface Props {
  data: DocumentExportData;
  code: string;
}

type ActionKey = "markdown" | "download" | "docstrings" | "inject";

export function DocActionsBar({ data, code }: Props) {
  const [confirmed, setConfirmed] = useState<ActionKey | null>(null);
  const [injectNote, setInjectNote] = useState<string | null>(null);

  const flash = (key: ActionKey) => {
    setConfirmed(key);
    setTimeout(() => setConfirmed((c) => (c === key ? null : c)), 1800);
  };

  const copyMarkdown = async () => {
    const markdown = exportDocumentMarkdown(data);
    await navigator.clipboard.writeText(markdown);
    flash("markdown");
  };

  const downloadMarkdown = () => {
    const markdown = exportDocumentMarkdown(data);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const safeTitle = (data.title || "documentation")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .slice(0, 40)
      .replace(/\s+/g, "-") || "documentation";
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
    flash("download");
  };

  const copyDocstrings = async () => {
    const text = exportDocstrings(data.apiEntries, data.detectedLanguage);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    flash("docstrings");
  };

  const copyInjected = async () => {
    const result = injectDocstrings(code, data.apiEntries, data.detectedLanguage);
    if (result.injected === 0) {
      setInjectNote("No definitions matched");
      setTimeout(() => setInjectNote(null), 2500);
      return;
    }
    await navigator.clipboard.writeText(result.code);
    setInjectNote(
      `Injected ${result.injected}${result.skipped.length ? ` · ${result.skipped.length} skipped` : ""}`
    );
    flash("inject");
    setTimeout(() => setInjectNote(null), 2500);
  };

  const hasApi = data.apiEntries.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
      <button
        onClick={copyMarkdown}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        {confirmed === "markdown" ? (
          <>
            <Check className="h-3.5 w-3.5" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copy as Markdown
          </>
        )}
      </button>

      <button
        onClick={downloadMarkdown}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors"
      >
        {confirmed === "download" ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Saved
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" /> Download .md
          </>
        )}
      </button>

      <button
        onClick={copyDocstrings}
        disabled={!hasApi}
        title={hasApi ? "" : "No API entries detected to docstring"}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {confirmed === "docstrings" ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
          </>
        ) : (
          <>
            <FileCode2 className="h-3.5 w-3.5" /> Copy as Docstrings
          </>
        )}
      </button>

      <button
        onClick={copyInjected}
        disabled={!hasApi}
        title={hasApi ? "Copy your source with doc-comments inserted above each definition" : "No API entries detected to inject"}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {confirmed === "inject" ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
          </>
        ) : (
          <>
            <FilePlus2 className="h-3.5 w-3.5" /> Copy Source + Docstrings
          </>
        )}
      </button>

      {injectNote && (
        <span className="text-xs text-muted-foreground self-center">{injectNote}</span>
      )}
    </div>
  );
}
