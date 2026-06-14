import { getAnthropicClient } from "@/lib/ai/client";
import { DESIGN_PRINCIPLES } from "@/lib/ai/design-knowledge";
import type { DesignScreen, DesignSystem, PolishInput } from "@/types/polish";

// Polish renderer: Sonnet generates real, beautiful screens as self-contained
// HTML that consumes the design-system CSS variables. Output is sanitized
// (scripts/handlers stripped) and rendered in a sandboxed iframe.

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

/** ── Pure: strip scripts / event handlers / js: URLs (defense-in-depth). ── */
export function sanitizeScreenHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

export async function renderScreens(input: PolishInput, system: DesignSystem): Promise<DesignScreen[]> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: `You are a world-class design engineer. Produce 3 STUNNING, real screens for this product as self-contained HTML, in the "${system.direction}" design system. These must look like a top studio designed them — not AI-generated.

PRODUCT: ${input.name || "(unnamed)"} — ${input.productType}
AUDIENCE: ${input.audience || "(general)"}
DIRECTION: ${system.direction} — ${system.personality}
STYLE DIRECTIVE: ${system.spacingNote}; ${system.motionNote}
FONTS: display "${system.typography.displayFont}", body "${system.typography.bodyFont}", mono "${system.typography.monoFont}".

${DESIGN_PRINCIPLES}

HARD REQUIREMENTS for the HTML:
- Each screen is a complete <section> (or wrapper div) with its OWN <style> block scoped via a unique root class. Real, considered layout — not a centered template.
- Use ONLY the design-system CSS variables for color, never hardcoded hex: var(--background), var(--foreground), var(--card), var(--card-foreground), var(--primary), var(--primary-foreground), var(--secondary), var(--muted), var(--muted-foreground), var(--accent), var(--border), var(--ring), var(--destructive), var(--success). Use var(--radius), var(--font-display), var(--font-body), var(--font-mono). (These variables are injected by the host — do not redefine them.)
- Real, human copy specific to THIS product. No lorem, no marketing mush.
- Inline SVG for icons (never emoji). Responsive (use clamp / flex / grid). Include hover/focus states.
- NO <script>, no external JS, no external images (use CSS gradients/shapes or inline SVG). Fonts are provided by the host.
- Pick the 3 screens that best show the product (e.g. landing/hero, the main app/dashboard screen, and one of: pricing, auth, settings, detail).

CRITICAL: Keep each screen FOCUSED — one strong viewport (roughly 90–180 lines of HTML), not a giant multi-section page. All three screens MUST fit in your response as COMPLETE, valid JSON. Do not get cut off mid-screen; if you are running long, write fewer, complete screens rather than a truncated one.

Return ONLY valid JSON, no markdown:
{ "screens": [ { "name": "<screen name>", "html": "<self-contained HTML with its own <style>>" }, ... ] }`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No screens generated");
  const parsed = parseClaudeJSON<{ screens: DesignScreen[] }>(block.text);
  if (!Array.isArray(parsed.screens) || parsed.screens.length === 0) {
    throw new Error("No screens generated");
  }
  return parsed.screens.slice(0, 4).map((s) => ({ name: s.name, html: sanitizeScreenHtml(s.html) }));
}
