import { getAnthropicClient } from "@/lib/ai/client";
import type {
  AnsweredQuestion,
  BriefInput,
  BriefResult,
  BuildTicket,
  PromptTarget,
} from "@/types/brief";

// Brief Compiler + Universal Prompt Generator for Brief mode.
// Sonnet produces the structured brief + one canonical build prompt; the
// per-tool framing and Markdown are built by pure (testable) functions here.
// A Haiku pass validates the brief against the inputs (Layer-3 spirit).

function parseClaudeJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

/** Everything Sonnet returns — BriefResult minus the derived markdown/prompts. */
interface CompiledBrief {
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
  /** Canonical, tool-agnostic build prompt. */
  buildPrompt: string;
}

function contextBlock(input: BriefInput, answers: AnsweredQuestion[]): string {
  const qa = answers
    .filter((a) => a.answer.trim())
    .map((a) => `- (${a.category}) ${a.question}\n  Answer: ${a.answer}`)
    .join("\n");
  return [
    `Project name: ${input.name || "(unnamed)"}`,
    `Raw idea: ${input.rawIdea}`,
    `Target user: ${input.targetUser || "(not specified)"}`,
    `Problem: ${input.problem || "(not specified)"}`,
    input.extraContext.trim() ? `Extra context / notes:\n${input.extraContext}` : "",
    qa ? `\nClarifying answers:\n${qa}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** ── Pure: render the structured brief as Markdown (no AI, fully testable). ── */
export function buildBriefMarkdown(b: CompiledBrief): string {
  const bullets = (items: string[]) =>
    items.length ? items.map((i) => `- ${i}`).join("\n") : "_None specified._";
  const tickets = b.buildTickets.length
    ? b.buildTickets
        .map((t, i) => `${i + 1}. **${t.title}** _(${t.priority})_ — ${t.description}`)
        .join("\n")
    : "_None specified._";

  return [
    `# ${b.goal}`,
    ``,
    `**Target user:** ${b.targetUser}`,
    `**Problem:** ${b.problem}`,
    `**Core promise:** ${b.corePromise}`,
    ``,
    `## MVP Features`,
    bullets(b.mvpFeatures),
    ``,
    `## Non-Goals`,
    bullets(b.nonGoals),
    ``,
    `## User Flow`,
    b.userFlow,
    ``,
    `## Technical Requirements`,
    `**Stack:** ${b.techStack}`,
    `**Data needs:** ${b.dbNeeds}`,
    `**AI behavior:** ${b.aiBehavior}`,
    ``,
    `## Build Tickets`,
    tickets,
    ``,
    `## Validation Checklist`,
    bullets(b.validationChecklist),
  ].join("\n");
}

const TOOL_FRAMING: Record<PromptTarget, { label: string; header: string }> = {
  codex: {
    label: "Codex",
    header:
      "You are Codex, an autonomous coding agent that can read, edit, and run code. Build the following project. After writing the code, explain exactly how to run it locally.",
  },
  claude: {
    label: "Claude",
    header:
      "You are Claude, a careful senior engineer. Build the following project. Think through the architecture first, then implement it cleanly with clear file names and helpful comments.",
  },
  chatgpt: {
    label: "ChatGPT",
    header:
      "Act as an expert full-stack engineer. Build the following project step by step. Provide complete, runnable code and a short setup guide at the end.",
  },
  cursor: {
    label: "Cursor",
    header:
      "You are an AI pair programmer working inside the Cursor editor on this repository. Implement the following project across the appropriate files. Keep changes scoped and runnable.",
  },
  generic: {
    label: "Any AI agent",
    header:
      "You are an AI software engineer. Build the following project. Keep the implementation simple, well-named, and runnable, and document how to run it.",
  },
};

/** ── Pure: wrap the canonical build prompt with a tool's framing. ── */
export function wrapForTool(buildPrompt: string, brief: CompiledBrief, tool: PromptTarget): string {
  const { header } = TOOL_FRAMING[tool];
  return [
    header,
    ``,
    `=== PROJECT BRIEF ===`,
    `Goal: ${brief.goal}`,
    `Target user: ${brief.targetUser}`,
    `Core promise: ${brief.corePromise}`,
    ``,
    `=== BUILD INSTRUCTIONS ===`,
    buildPrompt,
    ``,
    `=== DEFINITION OF DONE ===`,
    brief.validationChecklist.length
      ? brief.validationChecklist.map((c) => `- ${c}`).join("\n")
      : "- The MVP runs locally and delivers the core promise.",
  ].join("\n");
}

function buildAllPrompts(brief: CompiledBrief): Record<PromptTarget, string> {
  const targets: PromptTarget[] = ["codex", "claude", "chatgpt", "cursor", "generic"];
  return targets.reduce(
    (acc, t) => {
      acc[t] = wrapForTool(brief.buildPrompt, brief, t);
      return acc;
    },
    {} as Record<PromptTarget, string>
  );
}

async function compile(input: BriefInput, answers: AnsweredQuestion[]): Promise<CompiledBrief> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [
      {
        role: "user",
        content: `You are a product strategist turning a founder's idea and clarifying answers into a precise, build-ready execution brief for an AI coding agent. Ground every field in the context below — do not invent features the user never implied.

CONTEXT:
${contextBlock(input, answers)}

Return ONLY valid JSON, no markdown, in exactly this shape:
{
  "goal": "<one clear sentence: what we are building>",
  "targetUser": "<who it is for>",
  "problem": "<the problem it solves>",
  "corePromise": "<the single promise to the user>",
  "mvpFeatures": ["<feature for the first version>", "..."],
  "nonGoals": ["<explicitly out of scope for v1>", "..."],
  "userFlow": "<numbered step-by-step of the core flow>",
  "techStack": "<recommended stack, kept simple and conventional>",
  "dbNeeds": "<data/storage needs in plain terms>",
  "aiBehavior": "<if AI is involved, what it should do; else 'None'>",
  "buildTickets": [
    { "title": "<short ticket title>", "description": "<what to build>", "priority": "high" }
  ],
  "validationChecklist": ["<how to verify the MVP works>", "..."],
  "buildPrompt": "<a direct, self-contained build prompt that instructs a coding agent to build this MVP: list the pages/screens, the data model, and the key behaviors. Tool-agnostic. Keep it focused and beginner-friendly, no over-engineering.>"
}`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No brief generated");
  return parseClaudeJSON<CompiledBrief>(block.text);
}

/** Layer-3 spirit: cheap pass that flags features unsupported by the input. */
async function validateBrief(brief: CompiledBrief, input: BriefInput): Promise<CompiledBrief> {
  const client = getAnthropicClient();
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Review this brief's MVP feature list against the original idea. Remove only features that are clearly not implied by the idea or answers (scope creep). Keep everything supported. Return ONLY valid JSON, no markdown:

ORIGINAL IDEA: ${input.rawIdea}
EXTRA CONTEXT: ${input.extraContext || "(none)"}
MVP FEATURES: ${JSON.stringify(brief.mvpFeatures)}

{ "mvpFeatures": ["<kept / trimmed feature>", "..."] }`,
        },
      ],
    });
    const block = res.content[0];
    if (block && block.type === "text") {
      const parsed = parseClaudeJSON<{ mvpFeatures: string[] }>(block.text);
      if (Array.isArray(parsed.mvpFeatures) && parsed.mvpFeatures.length > 0) {
        return { ...brief, mvpFeatures: parsed.mvpFeatures };
      }
    }
  } catch {
    // fall through — validation is best-effort
  }
  return brief;
}

/** Full compile step: structured brief + markdown + universal prompts. */
export async function compileBrief(
  input: BriefInput,
  answers: AnsweredQuestion[]
): Promise<BriefResult> {
  const raw = await compile(input, answers);
  const brief = await validateBrief(raw, input);
  return {
    goal: brief.goal,
    targetUser: brief.targetUser,
    problem: brief.problem,
    corePromise: brief.corePromise,
    mvpFeatures: brief.mvpFeatures,
    nonGoals: brief.nonGoals,
    userFlow: brief.userFlow,
    techStack: brief.techStack,
    dbNeeds: brief.dbNeeds,
    aiBehavior: brief.aiBehavior,
    buildTickets: brief.buildTickets,
    validationChecklist: brief.validationChecklist,
    briefMarkdown: buildBriefMarkdown(brief),
    prompts: buildAllPrompts(brief),
  };
}
