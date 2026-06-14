import {
  Wand2,
  Sparkles,
  FileText,
  GitCompare,
  Shield,
  Zap,
  Bot,
  Palette,
  type LucideIcon,
} from "lucide-react";

// Single source of truth for PlainCode's tools and the "idea → shipped system"
// arc. Consumed by the landing page, navbar, and page headers so names,
// taglines, icons, and accents never drift between surfaces.

export type StageId = "plan" | "design" | "build" | "understand" | "harden" | "ship";

export interface Stage {
  id: StageId;
  label: string;
  blurb: string;
}

/** The product arc, in order. "Build" is the outbound handoff, not a tool. */
export const STAGES: Stage[] = [
  { id: "plan", label: "Plan", blurb: "Turn a vague idea into a build-ready spec." },
  { id: "design", label: "Design", blurb: "Generate a real design system, not AI slop." },
  { id: "build", label: "Build", blurb: "Hand the spec to your AI agent and build it." },
  { id: "understand", label: "Understand", blurb: "Make sense of any code, fast." },
  { id: "harden", label: "Harden", blurb: "Pressure-test your decisions." },
  { id: "ship", label: "Ship", blurb: "Catch what breaks before users do." },
];

/** Pre-composed Tailwind classes (literal strings so JIT keeps them). */
export interface Accent {
  text: string;
  soft: string;
  border: string;
  solid: string;
  solidHover: string;
}

export interface Tool {
  id: string;
  name: string;
  stage: StageId;
  href: string;
  Icon: LucideIcon;
  accent: Accent;
  /** One short line for nav/cards. */
  tagline: string;
  /** A fuller description for the landing cards. */
  blurb: string;
  steps: string[];
  badge?: string;
}

const ACCENTS: Record<string, Accent> = {
  violet: {
    text: "text-violet-500",
    soft: "bg-violet-500/10 text-violet-500",
    border: "border-violet-500",
    solid: "bg-violet-500 text-white",
    solidHover: "hover:bg-violet-600",
  },
  blue: {
    text: "text-blue-500",
    soft: "bg-blue-500/10 text-blue-500",
    border: "border-blue-500",
    solid: "bg-blue-500 text-white",
    solidHover: "hover:bg-blue-600",
  },
  indigo: {
    text: "text-indigo-500",
    soft: "bg-indigo-500/10 text-indigo-500",
    border: "border-indigo-500",
    solid: "bg-indigo-500 text-white",
    solidHover: "hover:bg-indigo-600",
  },
  emerald: {
    text: "text-emerald-500",
    soft: "bg-emerald-500/10 text-emerald-500",
    border: "border-emerald-500",
    solid: "bg-emerald-500 text-white",
    solidHover: "hover:bg-emerald-600",
  },
  orange: {
    text: "text-orange-500",
    soft: "bg-orange-500/10 text-orange-500",
    border: "border-orange-500",
    solid: "bg-orange-500 text-white",
    solidHover: "hover:bg-orange-600",
  },
  amber: {
    text: "text-amber-500",
    soft: "bg-amber-500/10 text-amber-600",
    border: "border-amber-500",
    solid: "bg-amber-500 text-white",
    solidHover: "hover:bg-amber-600",
  },
  fuchsia: {
    text: "text-fuchsia-500",
    soft: "bg-fuchsia-500/10 text-fuchsia-500",
    border: "border-fuchsia-500",
    solid: "bg-fuchsia-500 text-white",
    solidHover: "hover:bg-fuchsia-600",
  },
};

export const TOOLS: Tool[] = [
  {
    id: "blueprint",
    name: "Blueprint",
    stage: "plan",
    href: "/blueprint",
    Icon: Wand2,
    accent: ACCENTS.violet,
    badge: "Start here",
    tagline: "Idea → build-ready spec",
    blurb:
      "Describe your idea badly — even one messy paragraph. Blueprint asks 5 sharp questions, then compiles a build-ready spec plus a ready-to-paste prompt for Codex, Claude, ChatGPT, Cursor, or any AI agent.",
    steps: [
      "Dump your idea, who it's for, and the problem it solves",
      "Answer 5 clarifying questions the AI asks back",
      "Copy the spec and a tailored prompt straight into your AI tool",
    ],
  },
  {
    id: "polish",
    name: "Polish",
    stage: "design",
    href: "/polish",
    Icon: Palette,
    accent: ACCENTS.fuchsia,
    badge: "Production-grade",
    tagline: "App → production-grade UI",
    blurb:
      "Describe your app or drop a screenshot. Polish designs one flagship screen, then critiques its own rendered result with vision and fixes what looks AI — production-grade UI you can actually ship, plus the design system (DESIGN.md + tokens) and prompts to build the rest on-brand.",
    steps: [
      "Describe the app (and optionally drop a screenshot of the current UI)",
      "Pick one of 3 distinct design directions the AI proposes",
      "Watch it draft, critique its own pixels, and refine — then ship the result",
    ],
  },
  {
    id: "explain",
    name: "Explain",
    stage: "understand",
    href: "/explain",
    Icon: Sparkles,
    accent: ACCENTS.blue,
    tagline: "Code → plain English",
    blurb:
      "Paste any snippet and understand it as part of a system — what it does, what it depends on, and what breaks if it fails. Five audience levels, from ELI5 to Developer Peer.",
    steps: [
      "Paste your code snippet into the editor",
      "Pick your audience — ELI5 up to Developer Peer",
      "Get a full explanation, including where this fits in a system",
    ],
  },
  {
    id: "document",
    name: "Document",
    stage: "understand",
    href: "/document",
    Icon: FileText,
    accent: ACCENTS.indigo,
    tagline: "Code → README-ready docs",
    blurb:
      "Paste code or point at a repo and get auto-generated documentation: a plain-English explanation, an API reference, three visual diagrams, a usage example, and inline annotations — exportable as Markdown.",
    steps: [
      "Paste any code snippet — function, module, or class",
      "Watch the doc stream in with three diagrams and an API table",
      "Copy as Markdown straight into your README, or as docstrings",
    ],
  },
  {
    id: "diff",
    name: "Diff",
    stage: "understand",
    href: "/diff",
    Icon: GitCompare,
    accent: ACCENTS.emerald,
    tagline: "Change → blast radius",
    blurb:
      "Before merging any change, see the blast radius. Paste before and after — understand what changed, what it affects downstream, and whether it's a real fix or a workaround.",
    steps: [
      "Paste the old version on the left, new version on the right",
      "Get a plain-English explanation of what changed and why",
      "See the blast radius: what this change breaks or improves",
    ],
  },
  {
    id: "defend",
    name: "Defend",
    stage: "harden",
    href: "/defend",
    Icon: Shield,
    accent: ACCENTS.orange,
    tagline: "Repo → 5 hard questions",
    blurb:
      "Point it at your GitHub repo. Five adversarial questions grounded in your actual code — architecture, edge cases, security, scalability, design tradeoffs. Find out if you can own what you shipped.",
    steps: [
      "Paste a public GitHub repository URL",
      "Answer 5 hard questions about your own code",
      "Get a Defense Score and a verdict on whether you understand your system",
    ],
  },
  {
    id: "vibe-check",
    name: "Ship Check",
    stage: "ship",
    href: "/vibe-check",
    Icon: Zap,
    accent: ACCENTS.amber,
    tagline: "Repo → ship score",
    blurb:
      "14 automated checks plus a systems stress test. Get a Ship Score out of 100 and a Failure Cascade — exactly what breaks first when your prototype meets real load.",
    steps: [
      "Paste a public GitHub repository URL",
      "Wait ~25 seconds while 14 checks + a stress test run",
      "Get your verdict, the failure chain at scale, and a file-level breakdown",
    ],
  },
];

/** Icon for the outbound "Build" stage (your AI agent — not a PlainCode tool). */
export const BUILD_STAGE_ICON: LucideIcon = Bot;

export function toolsByStage(stage: StageId): Tool[] {
  return TOOLS.filter((t) => t.stage === stage);
}
