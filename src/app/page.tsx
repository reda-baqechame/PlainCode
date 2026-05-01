import Link from "next/link";
import {
  Code2,
  Sparkles,
  BookOpen,
  GitCompare,
  GitBranch,
  Lock,
  Shield,
  ChevronRight,
  Zap,
  ArrowRight,
  Network,
  Layers,
  Database,
  AlertTriangle,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DemoShipCheck } from "@/components/DemoShipCheck";

/* ─── Tool cards ─────────────────────────────────────────────────────────── */
const tools = [
  {
    icon: <Sparkles className="h-6 w-6 text-blue-500" />,
    accent: "border-blue-500",
    name: "Explain",
    badge: "Start here",
    badgeColor: "bg-blue-500/10 text-blue-500",
    href: "/explain",
    what: "Paste any code snippet and understand it as part of a system — what it does, what it depends on, and what breaks if it fails. Five audience levels, from ELI5 to Developer Peer.",
    steps: [
      "Paste your code snippet into the editor",
      "Pick your audience — ELI5 up to Developer Peer",
      "Get a full explanation including where this fits in a system",
    ],
    cta: "Try Explain",
    ctaClass: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  {
    icon: <GitCompare className="h-6 w-6 text-green-500" />,
    accent: "border-green-500",
    name: "Explain a Diff",
    badge: "For PR reviews",
    badgeColor: "bg-green-500/10 text-green-500",
    href: "/diff",
    what: "Before merging any change, see the blast radius. Paste before and after — understand what changed, what it affects downstream, and whether this is a real fix or a workaround.",
    steps: [
      "Paste the old version on the left, new version on the right",
      "Get a plain-English explanation of what changed and why",
      "See the blast radius: what this change breaks or improves",
    ],
    cta: "Try Diff",
    ctaClass: "bg-green-500 hover:bg-green-600 text-white",
  },
  {
    icon: <Shield className="h-6 w-6 text-orange-500" />,
    accent: "border-orange-500",
    name: "Defend",
    badge: "Reality check",
    badgeColor: "bg-orange-500/10 text-orange-500",
    href: "/defend",
    what: "Point it at your GitHub repo. Five adversarial questions grounded in your actual code — architecture, edge cases, security, scalability, design tradeoffs. Find out if you can own what you shipped.",
    steps: [
      "Paste a public GitHub repository URL",
      "Answer 5 hard questions about your own code",
      "Get a Defense Score and a verdict on whether you actually understand your system",
    ],
    cta: "Try Defend",
    ctaClass: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  {
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    accent: "border-yellow-500",
    name: "Ship Check",
    badge: "Pre-ship",
    badgeColor: "bg-yellow-500/10 text-yellow-600",
    href: "/vibe-check",
    what: "14 automated checks plus a systems stress test. Get a Ship Score out of 100 and a Failure Cascade — exactly what breaks first when your prototype meets real load.",
    steps: [
      "Paste a public GitHub repository URL",
      "Wait ~25 seconds while 14 checks + a systems stress test run",
      "Get your verdict, the failure chain at scale, and a file-level breakdown",
    ],
    cta: "Run Ship Check",
    ctaClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
  },
];

/* ─── Feature grid ───────────────────────────────────────────────────────── */
const features = [
  {
    icon: <Network className="h-5 w-5 text-blue-500" />,
    title: "Systems Context",
    description:
      "Every explanation includes where the code fits in a system, what it depends on, and what breaks if it fails. Not just what the code does — but what it means for the system around it.",
  },
  {
    icon: <BookOpen className="h-5 w-5 text-purple-500" />,
    title: "5 Audience Levels",
    description:
      "ELI5, Non-Technical, Business Context, Technical Non-Dev, or Developer Peer. The same code explained completely differently depending on who's reading — not a one-size-fits-all dump.",
  },
  {
    icon: <GitCompare className="h-5 w-5 text-green-500" />,
    title: "Blast Radius on Every Diff",
    description:
      "Understand what a code change actually does to your system — what it affects downstream, whether it's breaking, and whether it improves or worsens resilience. Before you merge.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    title: "Failure Cascade Analysis",
    description:
      "Ship Check runs a systems stress test: three specific failure chains grounded in your actual files — what breaks first at 10x load, and why. Not generic advice — specific to your code.",
  },
  {
    icon: <Shield className="h-5 w-5 text-orange-500" />,
    title: "Defend Mode",
    description:
      "5 adversarial questions covering architecture, edge cases, security, scalability, and design decisions. Scored 0–100 per answer. Find out if you can actually stand by what you shipped.",
  },
  {
    icon: <Layers className="h-5 w-5 text-yellow-500" />,
    title: "3-Layer AI Validation",
    description:
      "Three Claude models run in sequence: one reads for intent, one generates output, one validates for errors. Built as a system — no single point of failure in the pipeline itself.",
  },
  {
    icon: <GitBranch className="h-5 w-5 text-cyan-500" />,
    title: "Architecture Diagrams",
    description:
      "Ship Check auto-generates a Mermaid architecture diagram of your repo. Every Explain also generates a logic flow diagram. See the structure, not just the code.",
  },
  {
    icon: <Database className="h-5 w-5 text-teal-500" />,
    title: "Q&A with Full Context",
    description:
      "After any explanation or audit, ask follow-up questions with full code context preserved. 'What happens if this function throws?' gets a grounded answer — not a generic one.",
  },
  {
    icon: <Lock className="h-5 w-5 text-slate-500" />,
    title: "Privacy Mode",
    description:
      "Opt in to disable AI training on your code. Your snippets are never stored, logged, or used to improve models — useful for proprietary codebases or sensitive business logic.",
  },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ── */}
      <nav className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Code2 className="h-5 w-5 text-primary" />
            PlainCode
          </div>
          <div className="flex items-center gap-3">
            <Link href="/explain" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Explain
            </Link>
            <Link href="/vibe-check" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ship Check
            </Link>
            <Link href="/defend" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Defend
            </Link>
            <Link
              href="/vibe-check"
              className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
            >
              Try free
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full mb-6 font-medium">
          <Zap className="h-3.5 w-3.5" />
          Free · No sign-up · 5,000+ repos checked
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
          Prototypes impress.{" "}
          <span className="text-primary">Systems survive.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          PlainCode helps you close the gap. Four tools that push you to think one level deeper —
          from code to system, from working to production-grade, from shipped to owned.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/vibe-check"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
          >
            <Zap className="h-4 w-4" />
            Stress-test your repo
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/defend"
            className="flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors text-sm"
          >
            <Shield className="h-4 w-4" />
            Defend your code
          </Link>
          <Link
            href="/explain"
            className="flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors text-sm"
          >
            <Sparkles className="h-4 w-4" />
            Explain a snippet
          </Link>
        </div>
      </section>

      {/* ── Demo Ship Check ── */}
      <DemoShipCheck />

      {/* ── What is PlainCode? ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl border border-border bg-card p-8 space-y-4">
          <h2 className="text-xl font-bold text-foreground">What is PlainCode?</h2>
          <p className="text-muted-foreground leading-relaxed">
            PlainCode exists because vibe coding produces prototypes, not systems. Every tool here pushes
            you to think one level deeper than the code in front of you — toward the system it belongs to,
            the dependencies it creates, and the failure modes it introduces.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Whether you&apos;re explaining a snippet to a teammate, reviewing a PR, defending your
            architecture, or stress-testing your pre-ship code, you&apos;re always asking the same
            question: <span className="text-foreground font-medium">does this hold up?</span>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Unlike a plain AI prompt, every result runs through a{" "}
            <span className="text-foreground font-medium">3-layer validation pipeline</span> — one model
            reads for intent, one generates the output, one checks it for errors. The pipeline itself is
            built as a system. There are no single points of failure.
          </p>
        </div>
      </section>

      {/* ── Tools ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground">Four ways to think in systems</h2>
          <p className="text-sm text-muted-foreground mt-2">Pick the one that fits what you need right now.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className={`rounded-xl border border-border bg-card overflow-hidden flex flex-col border-t-4 ${tool.accent}`}
            >
              <div className="p-6 flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">{tool.icon}</div>
                    <h3 className="text-lg font-bold text-foreground">{tool.name}</h3>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.what}</p>

                {/* How to use */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">How to use</p>
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
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <Link
                  href={tool.href}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tool.ctaClass}`}
                >
                  {tool.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground">How the AI pipeline works</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Three models. One result. No single point of failure.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              color: "text-blue-500",
              ring: "ring-blue-500/20 bg-blue-500/10",
              title: "Intent Analysis",
              model: "Claude Haiku",
              desc: "Reads your code first to understand what it does, what language and frameworks are used, and how complex it is. This context grounds everything that follows and prevents hallucinations.",
            },
            {
              step: "2",
              color: "text-primary",
              ring: "ring-primary/20 bg-primary/10",
              title: "Deep Generation",
              model: "Claude Sonnet",
              desc: "Uses the intent context to generate your structured output — explanation, questions, or audit — including the systems context of what this code connects to and what it breaks if it fails.",
            },
            {
              step: "3",
              color: "text-green-500",
              ring: "ring-green-500/20 bg-green-500/10",
              title: "Accuracy Validation",
              model: "Claude Haiku",
              desc: "Cross-checks the generated output against your original code. Factual errors are flagged and corrected before you see anything. If it can't be fixed, the confidence score drops.",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-card p-6 space-y-3 relative">
              <div className={`w-10 h-10 rounded-full ring-2 ${s.ring} flex items-center justify-center`}>
                <span className={`text-lg font-black ${s.color}`}>{s.step}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{s.title}</p>
                <p className={`text-xs font-medium ${s.color} mt-0.5`}>{s.model}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground">Everything included, nothing locked</h2>
          <p className="text-sm text-muted-foreground mt-2">All features free. No tiers. No paywalls.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-5 space-y-2">
              <div className="flex items-center gap-2">
                {f.icon}
                <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-foreground">Start thinking in systems — free, no account needed</h2>
        <p className="mt-3 text-muted-foreground">Paste your first snippet or repo in 30 seconds.</p>
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/vibe-check"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Run Ship Check
          </Link>
          <Link
            href="/explain"
            className="inline-flex items-center gap-2 border border-border px-8 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Explain some code
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            PlainCode
          </div>
          <p>Free for everyone</p>
        </div>
      </footer>

    </div>
  );
}
