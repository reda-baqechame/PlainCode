import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Layers,
  Network,
  Lock,
  ShieldCheck,
  Sparkles,
  Wand2,
  GitCompare,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { STAGES, TOOLS, toolsByStage, BUILD_STAGE_ICON } from "@/constants/tools";

/* ── Pipeline (how the AI works) ─────────────────────────────────────────── */
const pipeline = [
  {
    step: "1",
    title: "Intent Analysis",
    model: "Claude Haiku",
    desc: "Reads your input first to understand what it is, what's clear, and what's missing. This context grounds everything that follows and prevents hallucinations.",
  },
  {
    step: "2",
    title: "Deep Generation",
    model: "Claude Sonnet",
    desc: "Uses that intent to generate your structured output — a spec, an explanation, or an audit — including the systems context of what connects to what.",
  },
  {
    step: "3",
    title: "Accuracy Validation",
    model: "Claude Haiku",
    desc: "Cross-checks the output against your input. Errors are flagged and corrected before you see anything; if they can't be fixed, the confidence score drops.",
  },
];

/* ── Feature grid ────────────────────────────────────────────────────────── */
const features = [
  {
    icon: <Wand2 className="h-5 w-5 text-violet-500" />,
    title: "Universal AI prompts",
    description:
      "Every Blueprint compiles into a ready-to-paste prompt tailored for Codex, Claude, ChatGPT, Cursor, or any agent — so your AI builds the right thing the first time.",
  },
  {
    icon: <Network className="h-5 w-5 text-blue-500" />,
    title: "Systems context",
    description:
      "Every explanation shows where code fits in a system, what it depends on, and what breaks if it fails — not just what the code does.",
  },
  {
    icon: <GitCompare className="h-5 w-5 text-emerald-500" />,
    title: "Blast radius on every diff",
    description:
      "Understand what a change actually does to your system — what it affects downstream and whether it improves or worsens resilience — before you merge.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    title: "Adversarial pressure-testing",
    description:
      "Defend grills your repo with 5 questions grounded in your actual code; Ship Check runs 14 checks plus a failure-cascade stress test.",
  },
  {
    icon: <Layers className="h-5 w-5 text-indigo-500" />,
    title: "3-layer AI validation",
    description:
      "Three Claude models run in sequence — one reads for intent, one generates, one validates for errors. Built as a system, with no single point of failure.",
  },
  {
    icon: <Lock className="h-5 w-5 text-slate-500" />,
    title: "Private & free",
    description:
      "No sign-up, no database, nothing stored on our servers. Opt into Privacy Mode to disable AI training on your code entirely.",
  },
];

/* ── Stage → arc step ────────────────────────────────────────────────────── */
function StageStep({ stageId, label, blurb }: { stageId: string; label: string; blurb: string }) {
  const tools = toolsByStage(stageId as never);
  const isBuild = stageId === "build";
  const Icon = isBuild ? BUILD_STAGE_ICON : tools[0]?.Icon ?? Sparkles;
  const accentText = isBuild ? "text-muted-foreground" : tools[0]?.accent.text ?? "text-primary";

  return (
    <div className="relative flex-1 min-w-[150px]">
      <div className="rounded-xl border border-border bg-card p-4 h-full shadow-card card-hover">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${accentText}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{blurb}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {isBuild ? (
            <span className="text-[11px] text-muted-foreground italic">your AI agent</span>
          ) : (
            tools.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${t.accent.soft} hover:opacity-80 transition-opacity`}
              >
                {t.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid" aria-hidden />
        <div className="absolute inset-0 bg-radial-glow" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-card border border-border text-muted-foreground px-3 py-1 rounded-full mb-6 shadow-card float-up">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Spec-driven · Free · No sign-up
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] float-up">
            From <span className="text-gradient">idea</span> to{" "}
            <span className="text-gradient">shipped system</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed float-up">
            AI builds whatever you ask — including the wrong thing. PlainCode is the workspace that turns a
            vague idea into a build-ready spec, then helps you understand, harden, and ship the code your AI
            writes. One arc, six tools, no vibe-coding blind.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3 flex-wrap float-up">
            <Link
              href="/blueprint"
              className="inline-flex items-center gap-2 bg-brand-gradient text-white px-6 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90 transition-opacity"
            >
              <Wand2 className="h-4 w-4" />
              Start a Blueprint
              <ChevronRight className="h-4 w-4" />
            </Link>
            <a
              href="#arc"
              className="inline-flex items-center gap-2 border border-border bg-card px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors shadow-card"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ── The arc ── */}
      <section id="arc" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">One arc, end to end</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Most AI tools drop you into a chat box. PlainCode walks the whole path — so you always know which
            step you&apos;re on and what to do next.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          {STAGES.map((s, i) => (
            <div key={s.id} className="flex items-stretch gap-3 flex-1">
              <StageStep stageId={s.id} label={s.label} blurb={s.blurb} />
              {i < STAGES.length - 1 && (
                <div className="hidden md:flex items-center text-muted-foreground/40">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Before / after ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-7 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What you type
              </span>
              <p className="text-sm text-foreground/80 leading-relaxed font-mono bg-muted/50 rounded-lg p-4">
                &quot;an app where people can track their gym workouts and maybe share them with friends idk,
                something simple&quot;
              </p>
            </div>
            <div className="p-7 space-y-3 bg-radial-glow">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                What Blueprint hands your AI
              </span>
              <ul className="space-y-2 text-sm text-foreground/90">
                {[
                  "A scoped MVP: log workouts, view history, follow friends",
                  "Clear non-goals: no social feed, no coaching, no payments — yet",
                  "Data model, user flow, and a tailored build prompt for your tool",
                  "A validation checklist so you know when v1 is actually done",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools by stage ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Six tools, one workflow</h2>
          <p className="text-sm text-muted-foreground mt-2">Each one does a single job exceptionally well.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => {
            const Icon = tool.Icon;
            return (
              <div
                key={tool.id}
                className="rounded-xl border border-border bg-card overflow-hidden flex flex-col shadow-card card-hover"
              >
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${tool.accent.text}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="text-lg font-bold text-foreground">{tool.name}</h3>
                    </div>
                    {tool.badge && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${tool.accent.soft}`}>
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tool.blurb}</p>
                  <ol className="space-y-1.5">
                    {tool.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="px-6 pb-6">
                  <Link
                    href={tool.href}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tool.accent.solid} ${tool.accent.solidHover}`}
                  >
                    Open {tool.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How the AI pipeline works ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How the AI pipeline works</h2>
          <p className="text-sm text-muted-foreground mt-2">Three models. One result. No single point of failure.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pipeline.map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-card p-6 space-y-3 shadow-card">
              <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center">
                <span className="text-lg font-black text-white">{s.step}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{s.title}</p>
                <p className="text-xs font-medium text-primary mt-0.5">{s.model}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Everything included, nothing locked</h2>
          <p className="text-sm text-muted-foreground mt-2">All features free. No tiers. No paywalls.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-card">
              <div className="flex items-center gap-2">
                {f.icon}
                <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 text-center shadow-elevated">
          <div className="absolute inset-0 bg-radial-glow" aria-hidden />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Start with the idea. Ship the system.
            </h2>
            <p className="mt-3 text-muted-foreground">Write your first Blueprint in under a minute — free, no account.</p>
            <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/blueprint"
                className="inline-flex items-center gap-2 bg-brand-gradient text-white px-7 py-3 rounded-lg font-semibold shadow-glow hover:opacity-90 transition-opacity"
              >
                <Wand2 className="h-4 w-4" />
                Start a Blueprint
              </Link>
              <Link
                href="/explain"
                className="inline-flex items-center gap-2 border border-border px-7 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Explain some code
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
