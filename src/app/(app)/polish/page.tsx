"use client";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, RotateCcw, FileText, Check, Link2, Plus } from "lucide-react";
import type {
  DesignAnalysis,
  DesignCritique,
  DesignScreen,
  DesignSystem,
  PolishInput,
  PolishResult,
} from "@/types/polish";
import { savePolishHistory, getPolishHistory, type PolishHistoryEntry } from "@/lib/utils/history";
import { exportPolishMarkdown } from "@/lib/utils/export-markdown";
import { encodePolishShare, decodePolishShare, buildPolishShareUrl } from "@/lib/utils/share";
import { captureHtml, googleFontsHref } from "@/lib/utils/capture";
import { PageHeader } from "@/components/layout/PageHeader";
import { PolishForm } from "@/components/polish/PolishForm";
import { DirectionPicker } from "@/components/polish/DirectionPicker";
import { DesignCanvas } from "@/components/polish/DesignCanvas";
import { DesignSystemPanel } from "@/components/polish/DesignSystemPanel";
import { TokenCodeTabs } from "@/components/polish/TokenCodeTabs";
import { RefineLog, type RefineEntry } from "@/components/polish/RefineLog";
import { UniversalPromptTabs } from "@/components/blueprint/UniversalPromptTabs";
import { FollowUpQA } from "@/components/FollowUpQA";

type Phase = "input" | "analyzing" | "directions" | "designing" | "results";

const EMPTY_INPUT: PolishInput = {
  name: "",
  productType: "",
  audience: "",
  vibe: "",
  currentCode: "",
  screenshot: undefined,
};
const MAX_PASSES = 2;
const GOOD_SCORE = 85;

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
  const [log, setLog] = useState<RefineEntry[]>([]);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addingScreen, setAddingScreen] = useState(false);

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
    setLog([]);
    setPhase("designing");

    // Mutable log we re-render after each step.
    const entries: RefineEntry[] = [];
    const begin = (label: string) => {
      entries.forEach((e) => (e.status = "done"));
      entries.push({ label, status: "active" });
      setLog([...entries]);
    };
    const mark = (label: string, score: number) => {
      entries.forEach((e) => (e.status = "done"));
      entries.push({ label, status: "done", score });
      setLog([...entries]);
    };
    const finish = () => {
      entries.forEach((e) => (e.status = "done"));
      setLog([...entries]);
    };

    try {
      begin("Building the design system");
      const cRes = await postJson(
        "/api/polish/compile",
        { input: { ...input, screenshot: undefined }, direction },
        120000
      );
      const system = (await cRes.json()) as DesignSystem & { error?: string };
      if (!cRes.ok) {
        setError(system.error ?? "Failed to compile design system");
        setPhase("directions");
        return;
      }

      const { screen, critiques } = await runDesignLoop(system, input, undefined, { begin, mark });
      finish();
      finishResult(system, [screen], critiques);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection error. Please try again.");
      setPhase("directions");
    }
  }

  /** draft → (render → critique → revise) up to MAX_PASSES. Degrades gracefully. */
  async function runDesignLoop(
    system: DesignSystem,
    forInput: PolishInput,
    exemplarHtml: string | undefined,
    log: { begin: (l: string) => void; mark: (l: string, s: number) => void }
  ): Promise<{ screen: DesignScreen; critiques: DesignCritique[] }> {
    const clean = { ...forInput, screenshot: undefined };
    log.begin("Designing the flagship screen");
    const dRes = await postJson(
      "/api/polish/draft",
      { input: clean, system, direction: system.direction, exemplarHtml },
      120000
    );
    const dData = await dRes.json();
    if (!dRes.ok) throw new Error(dData.error ?? "Failed to draft screen");
    let current = dData.screen as DesignScreen;
    const critiques: DesignCritique[] = [];
    const fontsHref = googleFontsHref(system.typography);

    for (let pass = 0; pass < MAX_PASSES; pass++) {
      log.begin("Rendering & screenshotting the result");
      const image = await captureHtml(current.html, system.tokens.css, fontsHref);
      if (!image) break; // capture unavailable — accept the current screen

      log.begin("Critiquing the actual pixels");
      const cRes = await postJson("/api/polish/critique", { input: clean, system, image }, 90000);
      if (!cRes.ok) break;
      const critique = (await cRes.json()) as DesignCritique;
      critiques.push(critique);
      log.mark(`Pass ${pass + 1} review`, critique.score);

      const goodEnough = critique.score >= GOOD_SCORE || (!critique.looksAI && critique.issues.length === 0);
      if (goodEnough || pass === MAX_PASSES - 1) break;

      log.begin("Applying the design director's fixes");
      const rRes = await postJson(
        "/api/polish/revise",
        { input: clean, system, current, critique },
        120000
      );
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.screen) current = rData.screen as DesignScreen;
      }
    }

    return { screen: current, critiques };
  }

  function finishResult(system: DesignSystem, screens: DesignScreen[], critiqueTrail: DesignCritique[]) {
    const full: PolishResult = {
      ...system,
      name: input.name.trim() || input.productType.slice(0, 40),
      screens,
      critiqueTrail,
    };
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

  async function handleAnotherScreen() {
    if (!result || addingScreen) return;
    setAddingScreen(true);
    setError("");
    try {
      const { screen } = await runDesignLoop(result, input, result.screens[0]?.html, {
        begin: () => {},
        mark: () => {},
      });
      const updated: PolishResult = { ...result, screens: [...result.screens, screen] };
      setResult(updated);
      savePolishHistory({
        id: `${Date.now()}`,
        name: updated.name,
        direction: updated.direction,
        date: new Date().toLocaleDateString(),
        result: updated,
      });
      setHistory(getPolishHistory());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate another screen — please try again.");
    } finally {
      setAddingScreen(false);
    }
  }

  function handleReset() {
    setPhase("input");
    setInput(EMPTY_INPUT);
    setAnalysis(null);
    setResult(null);
    setError("");
    setLog([]);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        toolId="polish"
        subtitle="Describe your app or drop a screenshot. Polish designs one flagship screen, then critiques its own rendered result with vision and fixes what looks AI — production-grade UI plus the design system to build the rest."
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

      {phase === "analyzing" && (
        <div aria-busy="true" aria-live="polite" className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 text-fuchsia-500 animate-spin" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">Studying your product</p>
            <p className="text-xs text-muted-foreground mt-1">Reading the vibe and proposing 3 real directions…</p>
          </div>
        </div>
      )}

      {phase === "designing" && (
        <div aria-busy="true" aria-live="polite">
          <RefineLog entries={log} />
        </div>
      )}

      {phase === "directions" && analysis && (
        <DirectionPicker analysis={analysis} onPick={handlePick} onBack={() => setPhase("input")} />
      )}

      {phase === "results" && result && (
        <div className="space-y-6 section-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{result.direction}</span>
              <span className="text-muted-foreground">— production-grade, rendered for real</span>
            </div>
            <DesignCanvas screens={result.screens} css={result.tokens.css} typography={result.typography} />
            <button
              onClick={handleAnotherScreen}
              disabled={addingScreen}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-lg py-2.5 disabled:opacity-50"
            >
              {addingScreen ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {addingScreen ? "Designing another screen…" : "Generate another screen in this style"}
            </button>
          </div>

          {result.critiqueTrail?.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <h2 className="text-sm font-semibold text-foreground">How it was refined</h2>
              <p className="text-xs text-muted-foreground">
                Polish screenshotted its own output and critiqued the real pixels, then fixed what looked generic.
              </p>
              <ol className="space-y-1.5 pt-1">
                {result.critiqueTrail.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-xs font-semibold text-fuchsia-500 mt-0.5">Pass {i + 1}</span>
                    <span className="text-foreground/85">
                      <span className="font-medium">{c.score}/100</span> — {c.verdict}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

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
