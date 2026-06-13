import { getAnthropicClient } from "@/lib/ai/client";
import type { AnalyzeResult, BlueprintInput, ClarifyingQuestion } from "@/types/blueprint";

// Context Analyzer + Clarifying-Question Generator for Blueprint mode.
// Mirrors the two-step (Haiku analyze -> Sonnet generate) shape used in
// src/app/api/defend/route.ts.

/** Strip ```json fences and parse. Same helper shape as defend/route.ts. */
function parseClaudeJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("The model returned an incomplete response. Please try again.");
  }
}

interface ContextAnalysis {
  summary: string;
  knownContext: string[];
  missingContext: string[];
  riskOfMisunderstanding: string[];
}

/** Build the input block once so both calls see the same framing. */
function inputBlock(input: BlueprintInput): string {
  return [
    `Project name: ${input.name || "(unnamed)"}`,
    `Raw idea: ${input.rawIdea}`,
    `Target user: ${input.targetUser || "(not specified)"}`,
    `Problem: ${input.problem || "(not specified)"}`,
    input.extraContext.trim() ? `Extra context / notes:\n${input.extraContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Layer 1: read the messy idea and map what we know vs. what's missing. */
async function analyzeContext(input: BlueprintInput): Promise<ContextAnalysis> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `You are a product strategist reading a half-formed software idea. Extract what is actually known versus what is dangerously underspecified. Return ONLY valid JSON, no markdown:

${inputBlock(input)}

Return this exact shape:
{
  "summary": "<one or two sentences restating the idea charitably and clearly>",
  "knownContext": ["<concrete fact we can already rely on>", "..."],
  "missingContext": ["<critical unknown that would lead to a bad build if guessed>", "..."],
  "riskOfMisunderstanding": ["<the most likely way an AI agent would misread this idea>", "..."]
}`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("no response");
    return parseClaudeJSON<ContextAnalysis>(block.text);
  } catch {
    return {
      summary: input.rawIdea.slice(0, 240),
      knownContext: [],
      missingContext: [],
      riskOfMisunderstanding: [],
    };
  }
}

/** Layer 2: ask the fewest questions that prevent a bad blueprint. */
async function generateQuestions(
  input: BlueprintInput,
  analysis: ContextAnalysis
): Promise<ClarifyingQuestion[]> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    messages: [
      {
        role: "user",
        content: `You are a product strategist preparing to write a build blueprint for an AI coding agent. Generate exactly 5 clarifying questions — one per category — that are the fewest questions required to prevent a bad output.

THE IDEA:
${inputBlock(input)}

WHAT'S ALREADY KNOWN: ${analysis.knownContext.join("; ") || "very little"}
WHAT'S MISSING: ${analysis.missingContext.join("; ") || "unclear"}

HARD RULES — every question must:
1. Target a specific gap above, not a generic checklist item.
2. Be answerable in one or two sentences by a non-technical founder.
3. Sharpen scope, audience, or success — not ask the user to design the system.

Use exactly these 5 categories in this order: "Target User", "Scope", "Non-Goals", "Success Metric", "Reference".

Return ONLY valid JSON, no markdown:
{
  "questions": [
    { "id": 1, "category": "Target User", "question": "<question>" },
    { "id": 2, "category": "Scope", "question": "<question>" },
    { "id": 3, "category": "Non-Goals", "question": "<question>" },
    { "id": 4, "category": "Success Metric", "question": "<question>" },
    { "id": 5, "category": "Reference", "question": "<question>" }
  ]
}`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No questions generated");
  const parsed = parseClaudeJSON<{ questions: ClarifyingQuestion[] }>(block.text);
  if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5) {
    throw new Error("Invalid questions format");
  }
  return parsed.questions;
}

/** Full analyze step: context map + 5 clarifying questions. */
export async function analyzeBlueprint(input: BlueprintInput): Promise<AnalyzeResult> {
  const analysis = await analyzeContext(input);
  const questions = await generateQuestions(input, analysis);
  return {
    summary: analysis.summary,
    knownContext: analysis.knownContext,
    missingContext: analysis.missingContext,
    questions,
  };
}
