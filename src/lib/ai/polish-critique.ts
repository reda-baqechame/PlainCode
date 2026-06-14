import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/ai/client";
import { imageBlockFromDataUrl } from "@/lib/ai/polish-analyze";
import { DESIGN_RUBRIC, AI_SLOP_MARKERS } from "@/lib/ai/design-knowledge";
import type { DesignCritique, DesignSystem, PolishInput } from "@/types/polish";

// Visual self-critique: Claude SEES the actual rendered screenshot and scores it
// against the rubric, returning concrete, actionable fixes. This is the loop that
// removes the "looks AI" gap — the AI judges what it actually made.

export function parseCritique(text: string): DesignCritique {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  let raw: unknown;
  try {
    raw = JSON.parse(cleaned);
  } catch {
    const s = cleaned.search(/[{]/);
    const e = cleaned.lastIndexOf("}");
    if (s !== -1 && e > s) raw = JSON.parse(cleaned.slice(s, e + 1));
    else throw new Error("The model returned an incomplete response. Please try again.");
  }
  const r = raw as Partial<DesignCritique>;
  const score = typeof r.score === "number" ? Math.max(0, Math.min(100, Math.round(r.score))) : 70;
  return {
    score,
    looksAI: Boolean(r.looksAI),
    issues: Array.isArray(r.issues)
      ? r.issues
          .filter((i) => i && typeof i.problem === "string")
          .map((i) => ({ area: String(i.area ?? "general"), problem: String(i.problem), fix: String(i.fix ?? "") }))
          .slice(0, 8)
      : [],
    verdict: typeof r.verdict === "string" ? r.verdict : "",
  };
}

export async function critiqueScreenImage(
  imageDataUrl: string,
  system: DesignSystem,
  input: PolishInput
): Promise<DesignCritique> {
  const image = imageBlockFromDataUrl(imageDataUrl);
  if (!image) throw new Error("Invalid screenshot");

  const client = getAnthropicClient();
  const instruction = `You are a ruthless senior design director reviewing a SCREENSHOT of a rendered screen for ${input.name || "this product"} — ${input.productType}, in the "${system.direction}" design system. Judge what you actually SEE.

${DESIGN_RUBRIC}

${AI_SLOP_MARKERS}

Be specific and visual (name the exact element, what's wrong, and the concrete fix). Do not invent problems that aren't visible. If it genuinely scores 85+ and doesn't look AI, return few or no issues.

Return ONLY valid JSON, no markdown:
{
  "score": <0-100>,
  "looksAI": <true if it still reads as a generic AI/template>,
  "issues": [ { "area": "<e.g. hero / spacing / type / color / nav>", "problem": "<what you see that's wrong>", "fix": "<the concrete change>" } ],
  "verdict": "<one-sentence overall judgment>"
}`;

  const content: Anthropic.ContentBlockParam[] = [{ type: "text", text: instruction }, image];
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content }],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No critique generated");
  return parseCritique(block.text);
}
