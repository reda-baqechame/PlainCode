import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/ai/client";
import { DESIGN_SYSTEM_BRIEF } from "@/lib/ai/design-knowledge";
import type { DesignAnalysis, DesignDirection, PolishInput } from "@/types/polish";

// Polish analyzer: reads the brief (and optional screenshot, multimodally),
// critiques the current UI's "AI slop" tells, and proposes 3 distinct design
// directions. Mirrors the Blueprint analyze shape.

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

function briefBlock(input: PolishInput): string {
  return [
    `Product name: ${input.name || "(unnamed)"}`,
    `What it is: ${input.productType}`,
    `Audience: ${input.audience || "(not specified)"}`,
    `Desired vibe: ${input.vibe || "(not specified)"}`,
    input.currentCode.trim() ? `Current CSS/code (excerpt):\n${input.currentCode.slice(0, 4000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Parse a data URL into an Anthropic image content block, or null if invalid. */
export function imageBlockFromDataUrl(
  dataUrl: string | undefined
): Anthropic.ImageBlockParam | null {
  if (!dataUrl) return null;
  const m = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  const mediaRaw = m[1] === "image/jpg" ? "image/jpeg" : m[1];
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mediaRaw as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
      data: m[2],
    },
  };
}

export async function analyzePolish(input: PolishInput): Promise<DesignAnalysis> {
  const client = getAnthropicClient();
  const image = imageBlockFromDataUrl(input.screenshot);

  const instruction = `You are a world-class product designer and design engineer. Study this product and (if shown) the screenshot of its current UI, then propose how to make it genuinely beautiful — not "AI-generated" looking.

${briefBlock(input)}

${DESIGN_SYSTEM_BRIEF}

Tasks:
1. Read the product's personality in one vivid sentence.
2. If a screenshot is shown, list the concrete "this looks AI" tells you can SEE in it (specific: the exact colors, fonts, spacing, layout clichés). If no screenshot, return an empty critique array.
3. Propose exactly 3 DISTINCT design directions tailored to THIS product — genuinely different from each other, each drawing on a real reference aesthetic, none of them the default shadcn/violet look.

Return ONLY valid JSON, no markdown:
{
  "personality": "<one sentence>",
  "critique": ["<specific AI-slop tell seen in the screenshot>", "..."],
  "directions": [
    { "id": "a", "name": "<evocative direction name>", "essence": "<one sentence on the feel>", "signature": "<signature fonts + color + radius/feel in one line>" },
    { "id": "b", "name": "...", "essence": "...", "signature": "..." },
    { "id": "c", "name": "...", "essence": "...", "signature": "..." }
  ]
}`;

  const content: Anthropic.ContentBlockParam[] = image
    ? [{ type: "text", text: instruction }, image]
    : [{ type: "text", text: instruction }];

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content }],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No analysis generated");
  const parsed = parseClaudeJSON<DesignAnalysis>(block.text);
  if (!Array.isArray(parsed.directions) || parsed.directions.length < 1) {
    throw new Error("Invalid directions format");
  }
  // Normalize to at most 3 directions with stable ids.
  parsed.directions = parsed.directions.slice(0, 3).map((d, i): DesignDirection => ({
    id: d.id || String.fromCharCode(97 + i),
    name: d.name,
    essence: d.essence,
    signature: d.signature,
  }));
  parsed.critique = Array.isArray(parsed.critique) ? parsed.critique : [];
  return parsed;
}
