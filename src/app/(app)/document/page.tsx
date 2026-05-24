"use client";
import { useState, useEffect, useCallback } from "react";
import { CodeInput } from "@/components/explain/CodeInput";
import { LanguageSelector } from "@/components/explain/LanguageSelector";
import { DocumentPanel } from "@/components/document/DocumentPanel";
import { useDocument } from "@/hooks/useDocument";
import { Loader2, FileText, Lock } from "lucide-react";

export default function DocumentPage() {
  const [code, setCode] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [privacyMode, setPrivacyMode] = useState(false);
  const { state, document: generate } = useDocument();

  const handleGenerate = useCallback(() => {
    if (!code.trim() || state.loading) return;
    generate({ code, outputLanguage, privacyMode });
  }, [code, outputLanguage, privacyMode, state.loading, generate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  const hasOutput = state.sections.TITLE || state.sections.OVERVIEW || state.currentSection;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Document Your Code</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paste code — get a polished, README-ready documentation page with three visual diagrams,
              an API reference, annotated source, and one-click Markdown export.
            </p>
          </div>

          <CodeInput value={code} onChange={setCode} />

          <div className="flex items-center justify-between flex-wrap gap-3">
            <LanguageSelector value={outputLanguage} onChange={setOutputLanguage} />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyMode}
                onChange={(e) => setPrivacyMode(e.target.checked)}
                className="rounded"
              />
              <Lock className="h-3 w-3" />
              Privacy mode
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!code.trim() || state.loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating documentation...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate Documentation
                <span className="text-xs opacity-70 ml-1">⌘↵</span>
              </>
            )}
          </button>

          {privacyMode && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Privacy mode: your code is never stored or used for training.
            </p>
          )}

          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">What you&apos;ll get:</p>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>Plain-English overview and purpose</li>
              <li>Auto-extracted API reference with typed parameters</li>
              <li>Three visual diagrams: control flow, sequence, data flow</li>
              <li>Usage example, edge cases, and complexity notes</li>
              <li>Inline annotated source code</li>
              <li>Copy as Markdown / download .md / copy as docstrings</li>
            </ul>
          </div>
        </div>

        {/* Right: Output */}
        <div>
          {!state.loading && !hasOutput ? (
            <div className="h-full min-h-[400px] flex items-center justify-center rounded-xl border-2 border-dashed border-border">
              <div className="text-center text-muted-foreground space-y-2 px-8">
                <FileText className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-sm">Your documentation will appear here</p>
                <p className="text-xs">Free for everyone · No sign-up required</p>
              </div>
            </div>
          ) : (
            <DocumentPanel stream={state} code={code} />
          )}
        </div>
      </div>
    </div>
  );
}
