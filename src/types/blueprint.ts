// Types for Blueprint mode (ContextOS engine): turn a vague idea into a
// build-ready, tool-agnostic AI execution blueprint.

/** Raw input the user provides on the Blueprint input form. */
export interface BlueprintInput {
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

/** The five most important questions to ask before compiling a blueprint. */
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

/** Output of the Context Analyzer + question generator (POST /api/blueprint/analyze). */
export interface AnalyzeResult {
  summary: string;
  knownContext: string[];
  missingContext: string[];
  questions: ClarifyingQuestion[];
}

/** The five AI tools we generate tailored build prompts for. */
export type PromptTarget = "codex" | "claude" | "chatgpt" | "cursor" | "generic";

/** One build ticket in the blueprint. */
export interface BuildTicket {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

/** The compiled blueprint plus the universal prompt set (POST /api/blueprint/compile). */
export interface BlueprintResult {
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
  /** The full blueprint rendered as Markdown (for export / copy / display). */
  blueprintMarkdown: string;
  /** Tool-tailored build prompts, ready to paste into each agent. */
  prompts: Record<PromptTarget, string>;
}
