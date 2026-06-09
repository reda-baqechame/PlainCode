import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { enforceRateLimit } from "@/lib/rate-limit";

function parseClaudeJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

const schema = z.object({
  repoCode: z.string().min(10).max(35_000),
  question: z.string().min(1),
  category: z.string(),
  answer: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "defend-score", 40);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { repoCode, question, category, answer } = parsed.data;
  const client = getAnthropicClient();

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a senior engineer evaluating a developer's defense of their code decisions.

CODEBASE EXCERPT:
\`\`\`
${repoCode.slice(0, 4000)}
\`\`\`

QUESTION [${category}]:
${question}

DEVELOPER'S ANSWER:
${answer}

Score the answer 0–100. Be strict. Penalize hand-wavy answers, buzzwords without substance, and answers that ignore the specific question.

Reward: deep understanding of the actual trade-off, honest acknowledgment of weaknesses, specific references to their own code.

Return ONLY valid JSON (no markdown):
{
  "score": <integer 0-100>,
  "feedback": "<one sharp sentence — what they nailed or missed, referencing specifics>"
}`,
        },
      ],
    });

    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("No response");
    const result = parseClaudeJSON<{ score: number; feedback: string }>(block.text);

    return NextResponse.json({
      score: Math.max(0, Math.min(100, Math.round(result.score))),
      feedback: result.feedback,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring failed" },
      { status: 500 }
    );
  }
}
