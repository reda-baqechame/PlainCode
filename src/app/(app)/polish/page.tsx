"use client";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, RotateCcw, FileText, Check, Link2, Wand2 } from "lucide-react";
import type {
  DesignAnalysis,
  DesignScreen,
  DesignSystem,
  PolishInput,
  PolishResult,
} from "@/types/polish";
import {
  savePolishHistory,
  getPolishHistory,
  type PolishHistoryEntry,
} from "@/lib/utils/history";
import { exportPolishMarkdown } from "@/lib/utils/export-markdown";
import { encodePolishShare, decodePolishShare, buildPolishShareUrl } from "@/lib/utils/share";
import { PageHeader } from "@/components/layout/PageHeader";
import { PolishForm } from "@/components/polish/PolishForm";
import { DirectionPicker } from "@/components/polish/DirectionPicker";
import { DesignCanvas } from "@/components/polish/DesignCanvas";
import { DesignSystemPanel } from "@/components/polish/DesignSystemPanel";
import { TokenCodeTabs } from "@/components/polish/TokenCodeTabs";
import { UniversalPromptTabs } from "@/components/blueprint/UniversalPromptTabs";
import { FollowUpQA } from "@/components/FollowUpQA";

type Phase = "input" | "analyzing" | "directions" | "compiling" | "designing" | "results";

const EMPTY_INPUT: PolishInput = {
  name: "",
  productType: "",
  audience: "",
  vibe: "",
  currentCode: "",
  screenshot: undefined,
};

/** POST JSON with a hard timeout so a slow/hung request can't spin forever. */
async function postJson(url: string, body: unknown, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("This is taking longer than expected — please try again.");
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export default function PolishPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [input, setInput] = useState<PolishInput>(EMPTY_INPUT);
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null);
  const [result, setResult] = useState<PolishResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<PolishHistoryEntry[]>([]);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [refine, setRefine] = useState("");
  const [refining, setRefining] = useState(false);

  useEffect(() => setHistory(getPolishHistory()), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#ps=")) {
      const decoded = decodePolishShare(hash.slice(4));
      if (decoded?.result) {
        setResult(decoded.result);
        setPhase("results");
      } else {
        setError("This shared link is invalid or corrupted.");
      }
    }
  }, []);

  async function handleAnalyze() {
    if (input.productType.trim().length < 5) return;
    setError("");
    setPhase("analyzing");
    try {
      const res = await postJson("/api/polish/analyze", input, 120000);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to analyze");
        setPhase("input");
        return;
      }
      setAnalysis(data as DesignAnalysis);
      setPhase("directions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection error. Please try again.");
      setPhase("input");
    }
  }

  async function handlePick(direction: string) {
    setError("");
    setPhase("compiling");
    try {
      const cRes = await postJson(
        "/api/polish/compile",
        { input: { ...input, screenshot: undefined }, direction },
        120000
      );
      const system = await cRes.json();
      if (!cRes.ok) {
        setError(system.error ?? "Failed to compile design system");
        setPhase("directions");
        return;
      }
      setPhase("designing");
      const screens = await requestScreens(system as DesignSystem, input);
      finishResult(system as DesignSystem, screens);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection error. Please try again.");
      setPhase("directions");
    }
  }

  async function requestScreens(system: DesignSystem, forInput: PolishInput): Promise<DesignScreen[]> {
    const rRes = await postJson(
      "/api/polish/render",
      { input: { ...forInput, screenshot: undefined }, system },
      150000
    );
    const data = await rRes.json();
    if (!rRes.ok) throw new Error(data.error ?? "Failed to render designs");
    return data.screens as DesignScreen[];
  }

  function finishResult(system: DesignSystem, screens: DesignScreen[]) {
    const full: PolishResult = { ...system, name: input.name.trim() || input.productType.slice(0, 40), screens };
    setResult(full);
    const entry: PolishHistoryEntry = {
      id: `${Date.now()}`,
      name: full.name,
      direction: full.direction,
      date: new Date().toLocaleDateString(),
      result: full,
    };
    savePolishHistory(entry);
    setHistory(getPolishHistory());
    setPhase("results");
  }

  async function handleRefine() {
    if (!result || !refine.trim() || refining) return;
    setRefining(true);
    try {
      const refinedInput: PolishInput = {
        ...input,
        screenshot: undefined,
        vibe: `${input.vibe} — Refinement: ${refine.trim()}`,
      };
      const screens = await requestScreens(result, refinedInput);
      const updated: PolishResult = { ...result, screens };
      setResult(updated);
      setRefine("");
    } catch {
      setError("Couldn't refine — please try again.");
    } finally {
      setRefining(false);
    }
  }

  function handleReset() {
    setPhase("input");
    setInput(EMPTY_INPUT);
    setAnalysis(null);
    setResult(null);
    setError("");
    setRefine("");
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        toolId="polish"
        subtitle="Describe your app or drop a screenshot of the current ugly UI. Get a real, rendered design — beautiful screens in actual code — plus the design system and prompts to keep your AI on-brand."
      />

      {error && (
        <div role="alert" className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {phase === "input" && (
        <div className="space-y-4">
          <PolishForm value={input} onChange={setInput} onSubmit={handleAnalyze} />
          {history.length > 0 && (
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              <p className="text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">
                Previous designs
              </p>
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setResult(entry.result);
                    setPhase("results");
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-accent transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.direction}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">{entry.date}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(phase === "analyzing" || phase === "compiling" || phase === "designing") && (
        <div aria-busy="true" aria-live="polite" className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 text-fuchsia-500 animate-spin" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              {phase === "analyzing" && "Studying your product"}
              {phase === "compiling" && "Building the design system"}
              {phase === "designing" && "Rendering your screens"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {phase === "analyzing" && "Reading the vibe and proposing 3 real directions…"}
              {phase === "compiling" && "Choosing fonts, colors, and tokens — and killing the slop…"}
              {phase === "designing" && "Generating beautiful, real screens in code…"}
            </p>
          </div>
        </div>
      )}

      {phase === "directions" && analysis && (
        <DirectionPicker
          analysis={analysis}
          onPick={handlePick}
          onBack={() => setPhase("input")}
        />
      )}

      {phase === "results" && result && (
        <div className="space-y-6 section-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{result.direction}</span>
              <span className="text-muted-foreground">— your design, rendered for real</span>
            </div>
            <DesignCanvas screens={result.screens} css={result.tokens.css} typography={result.typography} />
          </div>

          {/* Refine by intent */}
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-2">
            <input
              value={refine}
              onChange={(e) => setRefine(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRefine()}
              placeholder="Refine: e.g. make it warmer, denser, more editorial…"
              aria-label="Refine the design by intent"
              disabled={refining}
              className="flex-1 text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleRefine}
              disabled={!refine.trim() || refining}
              className="flex items-center gap-1.5 text-sm font-medium bg-fuchsia-500 text-white px-3.5 py-2 rounded-md hover:bg-fuchsia-600 transition-colors disabled:opacity-50"
            >
              {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Refine
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">The design system</h2>
            <DesignSystemPanel system={result} />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Design tokens</h2>
            <TokenCodeTabs tokens={result.tokens} />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Apply it with your AI tool</h2>
            <UniversalPromptTabs prompts={result.prompts} />
          </div>

          <FollowUpQA
            context={`You are a senior design engineer helping apply this design system.\n\n${result.designMd}`}
            title="Questions about your design?"
            placeholder="e.g. How do I apply these tokens in Tailwind?"
            suggestions={["How do I wire these tokens into Tailwind v4?", "What should the empty states look like?", "How do I keep this consistent across screens?"]}
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(exportPolishMarkdown(result));
                setCopiedMd(true);
                setTimeout(() => setCopiedMd(false), 2000);
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors text-sm"
            >
              {copiedMd ? <Check className="h-4 w-4 text-green-500" /> : <FileText className="h-4 w-4" />}
              {copiedMd ? "Copied!" : "Copy DESIGN.md"}
            </button>
            <button
              onClick={async () => {
                const url = buildPolishShareUrl(window.location.origin, encodePolishShare({ result }));
                await navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors text-sm"
            >
              {copiedLink ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
              {copiedLink ? "Link copied!" : "Copy link"}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              New design
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
