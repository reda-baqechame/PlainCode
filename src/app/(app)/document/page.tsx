"use client";
import { useState, useEffect, useCallback } from "react";
import { CodeInput } from "@/components/explain/CodeInput";
import { LanguageSelector } from "@/components/explain/LanguageSelector";
import { GithubUrlInput } from "@/components/ui/GithubUrlInput";
import { DocumentPanel } from "@/components/document/DocumentPanel";
import { useDocument } from "@/hooks/useDocument";
import { Loader2, FileText, Lock, Code2, Github } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SourceMode = "paste" | "repo";

export default function DocumentPage() {
  const [sourceMode, setSourceMode] = useState<SourceMode>("paste");
  const [code, setCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [privacyMode, setPrivacyMode] = useState(false);

  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [repoMeta, setRepoMeta] = useState<{ fileCount: number; truncated: boolean } | null>(null);
  const [isRepoResult, setIsRepoResult] = useState(false);

  const { state, document: generate } = useDocument();

  const generatePaste = useCallback(() => {
    if (!code.trim() || state.loading) return;
    setFetchError("");
    setRepoMeta(null);
    setIsRepoResult(false);
    generate({ code, outputLanguage, privacyMode, isRepo: false });
  }, [code, outputLanguage, privacyMode, state.loading, generate]);

  const generateRepo = useCallback(async () => {
    if (!repoUrl.trim() || state.loading || fetching) return;
    setFetchError("");
    setRepoMeta(null);
    setFetching(true);
    try {
      const res = await fetch("/api/fetch-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error ?? "Failed to fetch repository");
        return;
      }
      setRepoMeta({ fileCount: data.fileCount, truncated: data.truncated });
      setIsRepoResult(true);
      generate({ code: data.repoCode, outputLanguage, privacyMode, isRepo: true });
    } catch {
      setFetchError("Could not reach the repository. Check the URL and try again.");
    } finally {
      setFetching(false);
    }
  }, [repoUrl, outputLanguage, privacyMode, state.loading, fetching, generate]);

  const handleGenerate = useCallback(() => {
    if (sourceMode === "repo") generateRepo();
    else generatePaste();
  }, [sourceMode, generateRepo, generatePaste]);

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

  const busy = state.loading || fetching;
  const hasOutput = state.sections.TITLE || state.sections.OVERVIEW || state.currentSection;
  const canSubmit = sourceMode === "repo" ? !!repoUrl.trim() : !!code.trim();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Document Your Code</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paste a snippet or point at a whole GitHub repo — get polished, README-ready
              documentation with three visual diagrams, an API reference, and one-click export.
            </p>
          </div>

          {/* Source toggle */}
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
            <button
              onClick={() => setSourceMode("paste")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                sourceMode === "paste"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              Paste code
            </button>
            <button
              onClick={() => setSourceMode("repo")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                sourceMode === "repo"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Github className="h-3.5 w-3.5" />
              GitHub repo
            </button>
          </div>

          {sourceMode === "paste" ? (
            <CodeInput value={code} onChange={setCode} />
          ) : (
            <div className="space-y-2">
              <GithubUrlInput
                value={repoUrl}
                onChange={setRepoUrl}
                onSubmit={handleGenerate}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                Public repositories only. Up to ~80 source files / 30k characters are analyzed.
              </p>
              {repoMeta && (
                <p className="text-xs text-muted-foreground">
                  Analyzed {repoMeta.fileCount} file{repoMeta.fileCount === 1 ? "" : "s"}
                  {repoMeta.truncated ? " (truncated to fit)" : ""}.
                </p>
              )}
            </div>
          )}

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
            disabled={!canSubmit || busy}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching repository...
              </>
            ) : state.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating documentation...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                {sourceMode === "repo" ? "Document Repository" : "Generate Documentation"}
                <span className="text-xs opacity-70 ml-1">⌘↵</span>
              </>
            )}
          </button>

          {fetchError && (
            <p className="text-xs text-destructive">{fetchError}</p>
          )}

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
              <li>{sourceMode === "repo" ? "Project-level architecture from your whole repo" : "Inline annotated source code"}</li>
              <li>Follow-up Q&amp;A, copy as Markdown, and docstring export</li>
            </ul>
          </div>
        </div>

        {/* Right: Output */}
        <div>
          {!busy && !hasOutput ? (
            <div className="h-full min-h-[400px] flex items-center justify-center rounded-xl border-2 border-dashed border-border">
              <div className="text-center text-muted-foreground space-y-2 px-8">
                <FileText className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-sm">Your documentation will appear here</p>
                <p className="text-xs">Free for everyone · No sign-up required</p>
              </div>
            </div>
          ) : (
            <DocumentPanel
              stream={state}
              code={sourceMode === "repo" ? "" : code}
              isRepo={isRepoResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}
