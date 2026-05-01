import Link from "next/link";
import { CheckCircle2, XCircle, Lock, Key, BookOpen, Terminal, AlertCircle, Package, ArrowRight } from "lucide-react";

const DEMO_SCORE = 62;
const DEMO_REPO = "github.com/example/ai-saas-starter";

const DEMO_CHECKS = [
  {
    name: "No Hardcoded Secrets",
    passed: false,
    pts: 25,
    icon: Lock,
    color: "text-red-500",
    finding: "src/lib/openai.ts:3 — API key literal 'sk-proj-...' found in source",
  },
  {
    name: "Env Vars Documented",
    passed: false,
    pts: 15,
    icon: Key,
    color: "text-yellow-500",
    finding: "STRIPE_WEBHOOK_SECRET used in api/webhook.ts but missing from README",
  },
  {
    name: "README with Setup",
    passed: true,
    pts: 15,
    icon: BookOpen,
    color: "text-blue-500",
    finding: null,
  },
  {
    name: "No Debug Logs",
    passed: false,
    pts: 15,
    icon: Terminal,
    color: "text-slate-500",
    finding: "app/api/chat/route.ts:41 — console.log('user message:', body)",
  },
  {
    name: "Error Handling",
    passed: true,
    pts: 15,
    icon: AlertCircle,
    color: "text-orange-500",
    finding: null,
  },
  {
    name: "Pinned Dependencies",
    passed: true,
    pts: 15,
    icon: Package,
    color: "text-green-500",
    finding: null,
  },
];

function scoreRingColor(score: number) {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}
function scoreColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

export function DemoShipCheck() {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (DEMO_SCORE / 100) * circ;

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">See it in action</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Real Ship Check output — run against a typical AI SaaS starter repo.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-mono text-muted-foreground">{DEMO_REPO}</span>
          <span className="text-xs text-muted-foreground">Example output</span>
        </div>

        <div className="p-6 space-y-5">
          {/* Score + verdict */}
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
              <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
                <circle
                  cx="50" cy="50" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${filled} ${circ}`}
                  className={scoreRingColor(DEMO_SCORE)}
                />
              </svg>
              <span className={`text-xl font-bold ${scoreColor(DEMO_SCORE)}`}>{DEMO_SCORE}</span>
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">Ship Score</p>
              <p className="text-sm font-semibold text-amber-500">Demo Ready</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                You can show this to friends and early users, but do not take payments yet.
              </p>
            </div>
          </div>

          {/* Checks */}
          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {DEMO_CHECKS.map((check) => (
              <div key={check.name} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {check.passed
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                    <check.icon className={`h-3.5 w-3.5 ${check.color} shrink-0`} />
                    <span className="text-sm font-medium text-foreground">{check.name}</span>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${check.passed ? "text-green-500" : "text-red-500"}`}>
                    {check.passed ? `+${check.pts}` : `0 / ${check.pts}`} pts
                  </span>
                </div>
                {check.finding && (
                  <div className="ml-7 flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-red-500 shrink-0">↳</span>
                    <span className="font-mono">{check.finding}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/vibe-check"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Run Ship Check on your repo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
