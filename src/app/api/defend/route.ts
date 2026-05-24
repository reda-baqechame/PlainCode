import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { generateArchitectureDiagram } from "@/lib/ai/architecture-diagram";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  repoCode: z.string().min(100).max(35_000),
});

export interface DefendQuestion {
  id: number;
  category: string;
  question: string;
}

interface RepoAnalysis {
  techStack: string;
  architecture: string;
  keyRisks: string[];
  specificIdentifiers: {
    files: string[];
    functions: string[];
    patterns: string[];
  };
}

function parseClaudeJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

async function analyzeRepo(repoCode: string): Promise<RepoAnalysis> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `Analyze this codebase. Extract concrete details you can literally see in the code — actual file paths, function names, class names, variable names. Return ONLY valid JSON, no markdown:

${repoCode.slice(0, 6000)}

Return this exact shape:
{
  "techStack": "<languages, frameworks, databases, key libraries you see imported>",
  "architecture": "<brief architectural pattern visible in the code>",
  "keyRisks": ["<specific technical risk 1>", "<specific technical risk 2>", "<specific technical risk 3>"],
  "specificIdentifiers": {
    "files": ["<up to 6 actual file paths from the // FILE: headers above>"],
    "functions": ["<up to 8 actual function, class, or method names you see in the code>"],
    "patterns": ["<up to 4 specific implementation decisions or patterns visible in this code — e.g. 'singleton Anthropic client', 'SSE streaming via ReadableStream', 'Zod validation on all API inputs'>"]
  }
}`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("no response");
    return parseClaudeJSON<RepoAnalysis>(block.text);
  } catch {
    return {
      techStack: "unknown",
      architecture: "unknown",
      keyRisks: [],
      specificIdentifiers: { files: [], functions: [], patterns: [] },
    };
  }
}

async function generateQuestions(
  repoCode: string,
  analysis: RepoAnalysis
): Promise<DefendQuestion[]> {
  const client = getAnthropicClient();

  const identifierBlock = [
    analysis.specificIdentifiers.files.length
      ? `Files: ${analysis.specificIdentifiers.files.join(", ")}`
      : "",
    analysis.specificIdentifiers.functions.length
      ? `Functions/Classes: ${analysis.specificIdentifiers.functions.join(", ")}`
      : "",
    analysis.specificIdentifiers.patterns.length
      ? `Patterns: ${analysis.specificIdentifiers.patterns.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: `You are a senior engineer conducting a rigorous technical defense of a specific codebase. Generate exactly 5 adversarial questions — one per category — that only someone who built THIS project could answer.

CODEBASE ANALYSIS:
- Tech stack: ${analysis.techStack}
- Architecture: ${analysis.architecture}
- Key risks: ${analysis.keyRisks.join(", ")}

SPECIFIC CODE IDENTIFIERS (use these in your questions):
${identifierBlock}

CODEBASE:
${repoCode.slice(0, 12000)}

HARD RULES — every question must:
1. Name at least one specific function, file, or pattern from the identifiers list above
2. Be impossible to answer without having read this exact codebase
3. Assume the developer made a debatable choice and force them to defend it
4. Be answerable in 2-3 paragraphs — not a yes/no

FORBIDDEN — do not write:
- Generic questions like "How does your error handling work?" (no specific reference)
- Questions about concepts not visible in this code
- Trick questions with no defensible answer

EXAMPLE of a good question: "Your \`runPipeline()\` starts the Layer 2 stream before \`layer1Promise\` resolves, then overwrites the user prompt with the real \`inferredPurpose\` — what's the actual latency win here, and what breaks if Layer 1 takes longer than Layer 2?"

Return ONLY valid JSON, no markdown:
{
  "questions": [
    { "id": 1, "category": "Architecture", "question": "<question naming specific files/functions>" },
    { "id": 2, "category": "Edge Cases", "question": "<question naming specific files/functions>" },
    { "id": 3, "category": "Security", "question": "<question naming specific files/functions>" },
    { "id": 4, "category": "Scalability", "question": "<question naming specific files/functions>" },
    { "id": 5, "category": "Alternatives", "question": "<question naming specific files/functions>" }
  ]
}`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No questions generated");
  const parsed = parseClaudeJSON<{ questions: DefendQuestion[] }>(block.text);
  if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5) {
    throw new Error("Invalid questions format");
  }
  return parsed.questions;
}

async function validateAndRefineQuestions(
  questions: DefendQuestion[],
  repoCode: string
): Promise<DefendQuestion[]> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Review these 5 technical defense questions. Reject any that are generic (could apply to any codebase) or don't name a specific file, function, or pattern from THIS codebase.

QUESTIONS:
${JSON.stringify(questions, null, 2)}

CODEBASE EXCERPT:
${repoCode.slice(0, 3000)}

For each generic question, rewrite it to reference a specific identifier visible in the code above.

Return ONLY valid JSON, no markdown:
{
  "allSpecific": <true if every question names a specific file/function/pattern from this codebase>,
  "improvements": [
    { "id": <question id>, "betterQuestion": "<rewritten question with specific code reference>" }
  ]
}

Only include improvements for questions that are too generic. If all are specific, return empty array.`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") return questions;
    const result = parseClaudeJSON<{
      allSpecific: boolean;
      improvements: { id: number; betterQuestion: string }[];
    }>(block.text);
    if (!result.allSpecific && Array.isArray(result.improvements)) {
      return questions.map((q) => {
        const imp = result.improvements.find((i) => i.id === q.id);
        return imp ? { ...q, question: imp.betterQuestion } : q;
      });
    }
  } catch {
    // fall through
  }
  return questions;
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "defend", 15);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { repoCode } = parsed.data;
    const analysis = await analyzeRepo(repoCode);
    const questions = await generateQuestions(repoCode, analysis);
    const [refined, architectureDiagram] = await Promise.all([
      validateAndRefineQuestions(questions, repoCode),
      generateArchitectureDiagram(repoCode, {
        techStack: analysis.techStack,
        architecture: analysis.architecture,
        dangerHints: analysis.keyRisks,
      }),
    ]);
    return NextResponse.json({
      questions: refined,
      techStack: analysis.techStack,
      architectureDiagram,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
