// Types for Brief mode (ContextOS engine): turn a vague idea into a
// build-ready, tool-agnostic AI execution brief.

/** Raw input the user provides on the Brief input form. */
export interface BriefInput {
  /** Project name. */
  name: string;
  /** The messy, half-formed idea in the user's own words. */
  rawIdea: string;
  /** Who the product is for. */
  targetUser: string;
  /** The problem it solves. */
  problem: string;
  /** Optional pasted notes, links, examples, constraints. */
  extraContext: string;
}

/** The five most important questions to ask before compiling a brief. */
export interface ClarifyingQuestion {
  id: number;
  /** e.g. "Target User", "Scope", "Non-Goals", "Success Metric", "Reference". */
  category: string;
  question: string;
}

/** A clarifying question the user has answered (answer may be blank if skipped). */
export interface AnsweredQuestion extends ClarifyingQuestion {
  answer: string;
}

/** Output of the Context Analyzer + question generator (POST /api/brief/analyze). */
export interface AnalyzeResult {
  summary: string;
  knownContext: string[];
  missingContext: string[];
  questions: ClarifyingQuestion[];
}

/** The five AI tools we generate tailored build prompts for. */
export type PromptTarget = "codex" | "claude" | "chatgpt" | "cursor" | "generic";

/** One build ticket in the brief. */
export interface BuildTicket {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

/** The compiled brief plus the universal prompt set (POST /api/brief/compile). */
export interface BriefResult {
  goal: string;
  targetUser: string;
  problem: string;
  corePromise: string;
  mvpFeatures: string[];
  nonGoals: string[];
  userFlow: string;
  techStack: string;
  dbNeeds: string;
  aiBehavior: string;
  buildTickets: BuildTicket[];
  validationChecklist: string[];
  /** The full brief rendered as Markdown (for export / copy / display). */
  briefMarkdown: string;
  /** Tool-tailored build prompts, ready to paste into each agent. */
  prompts: Record<PromptTarget, string>;
}
