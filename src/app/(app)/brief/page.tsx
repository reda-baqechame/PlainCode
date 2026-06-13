"use client";
import { useState, useEffect } from "react";
import {
  Wand2,
  Loader2,
  AlertCircle,
  RotateCcw,
  FileText,
  Check,
  Link2,
} from "lucide-react";
import type {
  AnalyzeResult,
  AnsweredQuestion,
  BriefInput,
  BriefResult,
} from "@/types/brief";
import {
  saveBriefHistory,
  getBriefHistory,
  type BriefHistoryEntry,
} from "@/lib/utils/history";
import { exportBriefMarkdown } from "@/lib/utils/export-markdown";
import {
  encodeBriefShare,
  decodeBriefShare,
  buildBriefShareUrl,
} from "@/lib/utils/share";
import { BriefForm } from "@/components/brief/BriefForm";
import { ClarifyingQuestions } from "@/components/brief/ClarifyingQuestions";
import { BriefPanel } from "@/components/brief/BriefPanel";
import { UniversalPromptTabs } from "@/components/brief/UniversalPromptTabs";
import { FollowUpQA } from "@/components/FollowUpQA";

type Phase = "input" | "analyzing" | "questions" | "compiling" | "results";

const EMPTY_INPUT: BriefInput = {
  name: "",
  rawIdea: "",
  targetUser: "",
  problem: "",
  extraContext: "",
};

export default function BriefPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [input, setInput] = useState<BriefInput>(EMPTY_INPUT);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [result, setResult] = useState<BriefResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<BriefHistoryEntry[]>([]);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setHistory(getBriefHistory());
  }, []);

  // Decode a shared brief from the URL hash (#b=...) on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#b=")) {
      const decoded = decodeBriefShare(hash.slice(3));
      if (decoded?.result) {
        setResult(decoded.result);
        setPhase("results");
      }
    }
  }, []);

  async function handleAnalyze() {
    if (input.rawIdea.trim().length < 10) return;
    setError("");
    setPhase("analyzing");
    try {
      const res = await fetch("/api/brief/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to analyze idea");
        setPhase("input");
        return;
      }
      const result: AnalyzeResult = data;
      setAnalysis(result);
      setAnswers(
        result.questions.map((q) => ({ ...q, answer: "" }))
      );
      setPhase("questions");
    } catch {
      setError("Connection error. Please try again.");
      setPhase("input");
    }
  }

  function handleAnswerChange(id: number, answer: string) {
    setAnswers((prev) => prev.map((a) => (a.id === id ? { ...a, answer } : a)));
  }

  async function handleCompile() {
    setError("");
    setPhase("compiling");
    try {
      const res = await fetch("/api/brief/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to compile brief");
        setPhase("questions");
        return;
      }
      const brief: BriefResult = data;
      setResult(brief);
      const entry: BriefHistoryEntry = {
        id: `${Date.now()}`,
        name: input.name.trim() || brief.goal.slice(0, 60),
        goal: brief.goal,
        date: new Date().toLocaleDateString(),
        result: brief,
      };
      saveBriefHistory(entry);
      setHistory(getBriefHistory());
      setPhase("results");
    } catch {
      setError("Connection error. Please try again.");
      setPhase("questions");
    }
  }

  function handleReset() {
    setPhase("input");
    setInput(EMPTY_INPUT);
    setAnalysis(null);
    setAnswers([]);
    setResult(null);
    setError("");
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function openHistory(entry: BriefHistoryEntry) {
    setResult(entry.result);
    setPhase("results");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          Brief
        </h1>
        <p className="text-sm text-muted-foreground">
          Describe your idea badly. Get a perfect, build-ready brief — plus a ready-to-paste prompt for
          Codex, Claude, ChatGPT, Cursor, or any AI agent.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Phase: input ── */}
      {phase === "input" && (
        <div className="space-y-4">
          <BriefForm value={input} onChange={setInput} onSubmit={handleAnalyze} />

          {history.length > 0 && (
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              <p className="text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">
                Previous briefs
              </p>
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => openHistory(entry)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-accent transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.goal}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">{entry.date}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Phase: analyzing ── */}
      {phase === "analyzing" && (
        <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium text-foreground">Reading your idea</p>
            <p className="text-xs text-muted-foreground mt-1">
              Mapping what&apos;s clear and what&apos;s missing, then writing 5 sharp questions…
            </p>
          </div>
        </div>
      )}

      {/* ── Phase: questions ── */}
      {phase === "questions" && analysis && (
        <ClarifyingQuestions
          analysis={analysis}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleCompile}
          onBack={() => setPhase("input")}
        />
      )}

      {/* ── Phase: compiling ── */}
      {phase === "compiling" && (
        <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium text-foreground">Compiling your brief</p>
            <p className="text-xs text-muted-foreground mt-1">
              Turning your context into a build-ready brief and universal prompts…
            </p>
          </div>
        </div>
      )}

      {/* ── Phase: results ── */}
      {phase === "results" && result && (
        <div className="space-y-6 section-fade-in">
          <BriefPanel result={result} />

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Copy a prompt for your AI tool</h2>
            <UniversalPromptTabs prompts={result.prompts} />
          </div>

          <FollowUpQA
            context={`You are helping refine a product brief.\n\n${result.briefMarkdown}`}
            title="Questions about your brief?"
            placeholder="e.g. How should I scope the first sprint?"
            suggestions={[
              "What should I build first?",
              "What's the riskiest assumption here?",
              "How would you cut this scope in half?",
            ]}
          />

          {/* Export + share + reset */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(exportBriefMarkdown(result));
                setCopiedMd(true);
                setTimeout(() => setCopiedMd(false), 2000);
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors text-sm"
            >
              {copiedMd ? <Check className="h-4 w-4 text-green-500" /> : <FileText className="h-4 w-4" />}
              {copiedMd ? "Copied!" : "Copy as Markdown"}
            </button>
            <button
              onClick={async () => {
                const encoded = encodeBriefShare({ result });
                const url = buildBriefShareUrl(window.location.origin, encoded);
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
              New brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
