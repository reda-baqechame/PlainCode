"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Zap,
  Loader2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Lock,
  Key,
  BookOpen,
  Terminal,
  Package,
  Flame,
  FileText,
  Check,
  Link2,
  TestTube2,
  GitBranch,
  MessageSquare,
  FileCheck2,
  ShieldAlert,
  Gauge,
  BrainCircuit,
  Activity,
} from "lucide-react";
import { GithubUrlInput } from "@/components/ui/GithubUrlInput";
import { RoastCard } from "@/components/RoastCard";
import { FixPromptCard } from "@/components/FixPromptCard";
import { FilesMap, type FileEntry } from "@/components/FilesMap";
import { RepairPlan, type RepairStep } from "@/components/RepairPlan";
import { FlowDiagram } from "@/components/output/FlowDiagram";
import { FollowUpQA } from "@/components/FollowUpQA";
import { GithubActionsGenerator } from "@/components/GithubActionsGenerator";
import type { CheckResult } from "@/app/api/vibe-check/route";
import { saveShipHistory, getShipHistory, type ShipHistoryEntry } from "@/lib/utils/history";
import { exportShipCheckMarkdown } from "@/lib/utils/export-markdown";
import { encodeShareResult, decodeShipShare, buildShareUrl } from "@/lib/utils/share";

type Phase = "input" | "fetching" | "analyzing" | "results";

const CHECK_POINTS: Record<string, number> = {
  secrets: 25,
  env_vars: 15,
  readme: 15,
  console_logs: 15,
  error_handling: 15,
  dependencies: 15,
  tests: 10,
  ci_cd: 10,
  todos: 10,
  license: 5,
  ai_keys: 20,
  ai_rate_limit: 10,
  ai_prompts: 10,
  ai_error_handling: 10,
};

const CHECKS_META = [
  {
    category: "secrets",
    name: "No Hardcoded Secrets",
    desc: "No API keys, tokens, or passwords in code",
    pts: 25,
    Icon: Lock,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    category: "env_vars",
    name: "Env Vars Documented",
    desc: "All env vars in README or .env.example",
    pts: 15,
    Icon: Key,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    category: "readme",
    name: "README with Setup",
    desc: "README exists with install instructions",
    pts: 15,
    Icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    category: "console_logs",
    name: "No Debug Logs",
    desc: "No console.log left in production code",
    pts: 15,
    Icon: Terminal,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  {
    category: "error_handling",
    name: "Error Handling",
    desc: "Async calls wrapped in try/catch",
    pts: 15,
    Icon: AlertCircle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    category: "dependencies",
    name: "Pinned Dependencies",
    desc: "Dependency file present with locked versions",
    pts: 15,
    Icon: Package,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    category: "tests",
    name: "Tests Present",
    desc: "At least one test file detected",
    pts: 10,
    Icon: TestTube2,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    category: "ci_cd",
    name: "CI/CD Configured",
    desc: "CI/CD or deployment config present",
    pts: 10,
    Icon: GitBranch,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    category: "todos",
    name: "No TODOs in Production",
    desc: "No TODO/FIXME in non-test source files",
    pts: 10,
    Icon: MessageSquare,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    category: "license",
    name: "License File",
    desc: "LICENSE file present in repository",
    pts: 5,
    Icon: FileCheck2,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  {
    category: "ai_keys",
    name: "LLM Keys Not in Frontend",
    desc: "AI API keys referenced server-side only",
    pts: 20,
    Icon: ShieldAlert,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  {
    category: "ai_rate_limit",
    name: "AI Rate Limiting",
    desc: "Rate limiting on AI API routes",
    pts: 10,
    Icon: Gauge,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  {
    category: "ai_prompts",
    name: "System Prompts Server-Side",
    desc: "Prompt templates not exposed in client code",
    pts: 10,
    Icon: BrainCircuit,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    category: "ai_error_handling",
    name: "AI API Error Handling",
    desc: "AI calls wrapped with error handling",
    pts: 10,
    Icon: Activity,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
];

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

type VerdictTier = {
  label: string;
  color: string;
  context: string;
};

function getVerdictTier(score: number): VerdictTier {
  if (score <= 39) return {
    label: "Do Not Ship",
    color: "text-red-500",
    context: "Your repo has critical issues that would expose you or your users to real risk. Fix these before showing anyone.",
  };
  if (score <= 59) return {
    label: "Prototype Only",
    color: "text-orange-500",
    context: "Safe for internal testing, but not ready for real users. Keep building before you share the link.",
  };
  if (score <= 74) return {
    label: "Demo Ready",
    color: "text-yellow-500",
    context: "You can show this to friends and early users, but do not take payments yet.",
  };
  if (score <= 84) return {
    label: "Public Beta Ready",
    color: "text-blue-500",
    context: "Good enough for a public beta. Gather real feedback and fix the remaining issues before a full launch.",
  };
  if (score <= 94) return {
    label: "Launch Ready",
    color: "text-green-500",
    context: "You're clear to launch. Minor issues remain but nothing that blocks going live with real users.",
  };
  return {
    label: "Payment Ready",
    color: "text-emerald-400",
    context: "Production-grade. You can confidently take payments and onboard paying customers.",
  };
}

function getBuilderTypeStyle(builderType: string): string {
  switch (builderType) {
    case "Prompt Tourist":
      return "bg-red-500/10 text-red-500 border-red-500/30";
    case "Vibe Coder":
      return "bg-orange-500/10 text-orange-500 border-orange-500/30";
    case "Dangerous Shipper":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    case "Real Builder":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "Technical Founder":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          className={scoreRingColor(score)}
        />
      </svg>
      <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

export default function ShipCheckPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ShipHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getShipHistory());
    // Restore shared result from URL
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("r");
    if (encoded) {
      const data = decodeShipShare(encoded);
      if (data) {
        setRepoUrl(data.repoUrl);
        setShipScore(data.shipScore);
        setTechStack(data.techStack);
        setBuilderType(data.builderType);
        setAssessment(data.assessment);
        setChecks(data.checks as CheckResult[]);
        setPhase("results");
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [fileCount, setFileCount] = useState(0);
  const [shipScore, setShipScore] = useState(0);
  const [techStack, setTechStack] = useState("");
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [filesMap, setFilesMap] = useState<FileEntry[]>([]);
  const [architectureDiagram, setArchitectureDiagram] = useState("");
  const [assessment, setAssessment] = useState("");
  const [builderType, setBuilderType] = useState("");
  const [showRoastCard, setShowRoastCard] = useState(false);
  const [expandedFix, setExpandedFix] = useState<number | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  async function handleStart() {
    if (!repoUrl.trim()) return;
    setError("");
    setShowRoastCard(false);
    setPhase("fetching");

    try {
      const fetchRes = await fetch("/api/fetch-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const fetchData = await fetchRes.json();
      if (!fetchRes.ok) {
        setError(fetchData.error ?? "Failed to fetch repository");
        setPhase("input");
        return;
      }

      setFileCount(fetchData.fileCount);
      setPhase("analyzing");

      const auditRes = await fetch("/api/vibe-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoCode: fetchData.repoCode }),
      });
      const auditData = await auditRes.json();
      if (!auditRes.ok) {
        setError(auditData.error ?? "Failed to audit repository");
        setPhase("input");
        return;
      }

      setShipScore(auditData.shipScore);
      setTechStack(auditData.techStack ?? "");
      setFilesMap(auditData.keyFiles ?? []);
      setArchitectureDiagram(auditData.architectureDiagram ?? "");
      setAssessment(auditData.assessment ?? "");
      setBuilderType(auditData.builderType ?? "");
      setChecks((auditData.checks as CheckResult[]).sort((a, b) => a.id - b.id));
      const verdict = getVerdictTier(auditData.shipScore);
      const entry: ShipHistoryEntry = {
        repoUrl: repoUrl.trim(),
        repoName: repoUrl.trim().replace(/\/$/, "").split("/").pop() ?? "repo",
        score: auditData.shipScore,
        verdict: verdict.label,
        builderType: auditData.builderType ?? "",
        date: new Date().toLocaleDateString(),
      };
      saveShipHistory(entry);
      setHistory(getShipHistory());
      setPhase("results");
    } catch {
      setError("Connection error. Please try again.");
      setPhase("input");
    }
  }

  function handleReset() {
    setPhase("input");
    setRepoUrl("");
    setError("");
    setFileCount(0);
    setShipScore(0);
    setTechStack("");
    setChecks([]);
    setFilesMap([]);
    setArchitectureDiagram("");
    setAssessment("");
    setBuilderType("");
    setShowRoastCard(false);
    setExpandedFix(null);
  }

  const repoName = repoUrl.replace(/\/$/, "").split("/").pop() ?? "repo";
  const passedCount = checks.filter((c) => c.passed).length;

  const topFindings = checks
    .filter((c) => !c.passed && c.findings.length > 0)
    .map((c) => `${c.name}: ${c.findings[0].detail}`)
    .slice(0, 3);

  const repairSteps = useMemo((): RepairStep[] => {
    const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2 };
    const CATEGORY_PRIORITY: Record<string, RepairStep["priority"]> = {
      secrets: "critical",
      ai_keys: "critical",
      error_handling: "high",
      ai_error_handling: "high",
      env_vars: "high",
      ai_rate_limit: "high",
      ai_prompts: "high",
      readme: "medium",
      console_logs: "medium",
      dependencies: "medium",
      tests: "medium",
      ci_cd: "medium",
      todos: "medium",
      license: "medium",
    };

    return checks
      .filter((c) => !c.passed)
      .map((c) => {
        const priority = CATEGORY_PRIORITY[c.category] ?? "medium";
        const f = c.findings[0];
        const fileRef = f ? `${f.file}${f.line ? `:${f.line}` : ""}` : "";
        const issue = f?.detail || c.name;
        const description = (() => {
          switch (c.category) {
            case "secrets":
              return f
                ? `Remove hardcoded secret from ${f.file}${f.line ? `:${f.line}` : ""}`
                : "Remove hardcoded secrets from codebase";
            case "error_handling":
              return f ? `Add error handling in ${f.file}` : "Add try/catch to async operations";
            case "env_vars":
              return "Document all environment variables in README or .env.example";
            case "readme":
              return "Create a README with install steps and run instructions";
            case "console_logs":
              return f
                ? `Remove debug console.log from ${f.file}${f.line ? `:${f.line}` : ""}`
                : "Remove debug console.logs from production code";
            case "dependencies":
              return "Pin all dependency versions in package.json";
            case "tests":
              return "Add at least one test file (*.test.ts or *.spec.ts)";
            case "ci_cd":
              return "Add a CI/CD config (.github/workflows/, Dockerfile, or railway.toml)";
            case "todos":
              return f
                ? `Resolve TODO/FIXME in ${f.file}${f.line ? `:${f.line}` : ""}`
                : "Resolve all TODO/FIXME comments in production code";
            case "license":
              return "Add a LICENSE file to the repository root";
            case "ai_keys":
              return f
                ? `Move LLM API key reference from ${f.file} to server-side code`
                : "Ensure LLM API keys are never referenced in client-side files";
            case "ai_rate_limit":
              return f
                ? `Add rate limiting to ${f.file}`
                : "Add rate limiting or retry logic to AI API routes";
            case "ai_prompts":
              return f
                ? `Move system prompt from ${f.file} to server-side code`
                : "Keep system prompts server-side — never in client/frontend code";
            case "ai_error_handling":
              return f
                ? `Wrap AI API call in ${f.file} with try/catch`
                : "Add error handling for AI API failures (quota, timeout, overload)";
            default:
              return c.name;
          }
        })();
        return {
          priority,
          description,
          fileReference: fileRef,
          fixPromptCard: (
            <FixPromptCard
              failedCheck={c.name}
              fileReference={fileRef}
              specificIssue={issue}
              checkCategory={c.category}
              mode="fix"
            />
          ),
          _order: PRIORITY_ORDER[priority] ?? 3,
        };
      })
      .sort((a, b) => a._order - b._order)
      .slice(0, 7)
      .map(({ _order: _o, ...step }) => step);
  }, [checks]);

  const qaContext = (() => {
    if (checks.length === 0) return "";
    const verdict = getVerdictTier(shipScore);
    const failedChecks = checks.filter((c) => !c.passed);
    const passedChecks = checks.filter((c) => c.passed);
    return [
      `Repository: ${repoUrl}`,
      `Ship Score: ${shipScore}/100`,
      `Verdict: ${verdict.label}`,
      `Tech Stack: ${techStack}`,
      "",
      "Check Results:",
      ...passedChecks.map((c) => `✓ ${c.name} — PASSED`),
      ...failedChecks.map((c) => `✗ ${c.name} — FAILED`),
      "",
      "Failed Check Details:",
      ...failedChecks.map((c) =>
        `${c.name}: ${c.findings.map((f) => `${f.file}${f.line ? `:${f.line}` : ""} — ${f.detail}`).join("; ") || "no specific file found"}`
      ),
    ].join("\n");
  })();

  const qaSuggestions = (() => {
    const firstFailed = checks.find((c) => !c.passed);
    const suggestions = ["What should I fix first?"];
    if (firstFailed) suggestions.unshift(`Why did I fail the ${firstFailed.name} check?`);
    suggestions.push(`Is ${shipScore}/100 good enough to show to users?`);
    return suggestions;
  })();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Ship Check
        </h1>
        <p className="text-sm text-muted-foreground">
          6 automated checks on any public GitHub repo. Get a Ship Score out of 100
          and a verdict — from "Do Not Ship" to "Payment Ready" — so you know exactly
          where you stand before going live.
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
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">GitHub repository URL</span>
              <GithubUrlInput
                value={repoUrl}
                onChange={setRepoUrl}
                onSubmit={handleStart}
                placeholder="https://github.com/owner/repo"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Public repos only · no sign-up required</p>
            </label>

            <button
              onClick={handleStart}
              disabled={!repoUrl.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              Run Ship Check
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Recent checks history */}
          {history.length > 0 && (
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              <p className="text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Previous checks</p>
              {history.map((entry) => (
                <button
                  key={entry.repoUrl}
                  onClick={() => setRepoUrl(entry.repoUrl)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-accent transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.repoName}</p>
                    <p className="text-xs text-muted-foreground">{entry.date} · {entry.verdict}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ml-3 ${entry.score >= 80 ? "text-green-500" : entry.score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                    {entry.score}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Check preview grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CHECKS_META.map((m) => (
              <div
                key={m.category}
                className={`rounded-lg border ${m.border} ${m.bg} p-3 space-y-1`}
              >
                <div className="flex items-center gap-1.5">
                  <m.Icon className={`h-3.5 w-3.5 ${m.color} shrink-0`} />
                  <span className="text-xs font-semibold text-foreground leading-tight">{m.name}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{m.desc}</p>
                <p className={`text-xs font-bold ${m.color}`}>{m.pts} pts</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Phase: fetching / analyzing ── */}
      {(phase === "fetching" || phase === "analyzing") && (
        <div className="rounded-lg border border-border bg-card p-8 space-y-6">
          <div className="space-y-4">
            {[
              {
                label: "Fetching repository files",
                done: phase === "analyzing",
                active: phase === "fetching",
              },
              {
                label: "Running 6 ship-readiness checks",
                done: false,
                active: phase === "analyzing",
              },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : step.active ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-border shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    step.done
                      ? "text-muted-foreground line-through"
                      : step.active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                  {step.done && fileCount > 0 && i === 0 && (
                    <span className="ml-2 not-italic font-normal no-underline text-muted-foreground">
                      ({fileCount} files)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This usually takes 15–25 seconds
          </p>
        </div>
      )}

      {/* ── Phase: results ── */}
      {phase === "results" && (
        <div className="space-y-6 section-fade-in">
          {/* Score ring */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center gap-3 text-center">
            <ScoreRing score={shipScore} />
            <div>
              <p className="text-lg font-bold text-foreground">Ship Score</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {passedCount} of 6 checks passed
              </p>
            </div>
            {(() => {
              const verdict = getVerdictTier(shipScore);
              return (
                <div className="space-y-1">
                  <p className={`text-base font-bold ${verdict.color}`}>{verdict.label}</p>
                  <p className="text-xs text-muted-foreground max-w-xs">{verdict.context}</p>
                </div>
              );
            })()}
          </div>

          {/* Files map */}
          <FilesMap files={filesMap} />

          {/* Architecture diagram */}
          <FlowDiagram
            diagram={architectureDiagram}
            title="Architecture Overview"
            downloadName="architecture.svg"
          />

          {/* Repair plan */}
          <RepairPlan steps={repairSteps} />

          {/* CI/CD generator */}
          <GithubActionsGenerator repoUrl={repoUrl} shipScore={shipScore} />

          {/* Check results */}
          <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
            {checks.map((check) => {
              const meta = CHECKS_META.find((m) => m.category === check.category);
              const maxPts = CHECK_POINTS[check.category] ?? 15;
              const Icon = meta?.Icon ?? Zap;
              const firstFinding = check.findings[0];
              const fileRef = firstFinding
                ? `${firstFinding.file}${firstFinding.line ? `:${firstFinding.line}` : ""}`
                : "";
              const issue = firstFinding?.detail || check.name;
              const fixOpen = expandedFix === check.id;

              return (
                <div key={check.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className={`h-3.5 w-3.5 ${meta?.color ?? "text-muted-foreground"} shrink-0`} />
                        <span className="text-sm font-medium text-foreground truncate">
                          {check.name}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold shrink-0 ${
                        check.passed ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {check.passed ? `+${maxPts}` : `0 / ${maxPts}`} pts
                    </span>
                  </div>

                  {!check.passed && check.findings.length > 0 && (
                    <ul className="ml-7 space-y-1.5">
                      {check.findings.slice(0, 4).map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-red-500 mt-0.5 shrink-0">↳</span>
                          <span>
                            <span className="font-mono text-foreground/70">
                              {f.file}
                              {f.line ? `:${f.line}` : ""}
                            </span>
                            {f.detail ? ` — ${f.detail}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!check.passed && (
                    <div className="ml-7 space-y-2">
                      <button
                        onClick={() => setExpandedFix(fixOpen ? null : check.id)}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {fixOpen ? "Hide Fix Prompt" : "Show Fix Prompt →"}
                      </button>
                      {fixOpen && (
                        <FixPromptCard
                          failedCheck={check.name}
                          fileReference={fileRef}
                          specificIssue={issue}
                          checkCategory={check.category}
                          mode="fix"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Follow-up Q&A */}
          {qaContext && (
            <FollowUpQA
              context={qaContext}
              title="Questions About Your Results?"
              placeholder="e.g. Why did I fail the secrets check?"
              suggestions={qaSuggestions}
            />
          )}

          {/* Technical Assessment */}
          {assessment && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-sm font-semibold text-foreground">Technical Assessment</h2>
                {builderType && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getBuilderTypeStyle(builderType)}`}
                  >
                    {builderType}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground font-mono leading-relaxed">{assessment}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowRoastCard(!showRoastCard)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {showRoastCard ? "Hide Share Card" : "Share Results →"}
                </button>
                <button
                  onClick={async () => {
                    const verdict = getVerdictTier(shipScore);
                    const encoded = encodeShareResult({
                      repoUrl,
                      shipScore,
                      verdict: verdict.label,
                      builderType,
                      assessment,
                      techStack,
                      checks: checks.map((c) => ({ id: c.id, name: c.name, category: c.category, passed: c.passed, findings: c.findings })),
                    });
                    const url = buildShareUrl(window.location.origin + "/vibe-check", encoded);
                    await navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />}
                  {copiedLink ? "Link copied!" : "Copy link"}
                </button>
              </div>
            </div>
          )}

          {/* Roast card */}
          {!assessment && (
            <button
              onClick={() => setShowRoastCard(!showRoastCard)}
              className="w-full flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors"
            >
              <Flame className="h-4 w-4 text-orange-500" />
              {showRoastCard ? "Hide Roast Card" : "Generate Roast Card"}
            </button>
          )}

          {showRoastCard && (
            <RoastCard
              score={shipScore}
              scoreLabel="Ship Score"
              repoName={repoName}
              topFindings={topFindings}
              techStack={techStack}
              builderType={builderType || undefined}
              assessmentText={assessment || undefined}
            />
          )}

          {/* Export + Reset */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const verdict = getVerdictTier(shipScore);
                const md = exportShipCheckMarkdown({
                  repoUrl,
                  shipScore,
                  verdict: verdict.label,
                  builderType,
                  assessment,
                  checks,
                  techStack,
                });
                await navigator.clipboard.writeText(md);
                setCopiedMd(true);
                setTimeout(() => setCopiedMd(false), 2000);
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors text-sm"
            >
              {copiedMd ? <Check className="h-4 w-4 text-green-500" /> : <FileText className="h-4 w-4" />}
              {copiedMd ? "Copied!" : "Export Report"}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Check Another Repo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
