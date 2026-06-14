import { getAnthropicClient } from "@/lib/ai/client";
import { DESIGN_PRINCIPLES, DESIGN_RUBRIC } from "@/lib/ai/design-knowledge";
import type { DesignCritique, DesignScreen, DesignSystem, PolishInput } from "@/types/polish";

// Polish drafter: generates ONE flagship screen to a high bar, and revises it
// from a visual critique (reusing the app's generate → validate → revise idea).
// Output is a self-contained HTML FRAGMENT that consumes the design tokens.

/** ── Pure: strip scripts / handlers / js: URLs and any document wrapper. ── */
export function sanitizeScreenHtml(html: string): string {
  return html
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

const TOKEN_RULES = `Use ONLY these CSS variables for color (injected by the host — never redefine, never hardcode hex): var(--background) var(--foreground) var(--card) var(--card-foreground) var(--primary) var(--primary-foreground) var(--secondary) var(--muted) var(--muted-foreground) var(--accent) var(--border) var(--ring) var(--destructive) var(--success). Also var(--radius) var(--font-display) var(--font-body) var(--font-mono).`;

const FRAGMENT_RULES = `Output a single self-contained HTML FRAGMENT: its own <style> (scoped via a unique root class) followed by a <section>/<div>. NO <html>, <head>, <body>, <!doctype>, <script>, external JS, or external images. Inline SVG for icons (never emoji). Responsive (clamp/flex/grid) with real hover/focus states. Real, human copy for THIS product.`;

function screenLabel(input: PolishInput): string {
  return `${input.name || "the product"} — ${input.productType}`;
}

/** Draft the single most important screen for this product. */
export async function draftScreen(
  input: PolishInput,
  system: DesignSystem,
  direction: string,
  exemplarHtml?: string
): Promise<DesignScreen> {
  const client = getAnthropicClient();
  const exemplar = exemplarHtml
    ? `\nAn already-approved screen in this exact design language is below. MATCH its quality, type, spacing, and component style precisely (same system), but design a DIFFERENT screen:\n${exemplarHtml.slice(0, 6000)}\n`
    : "";

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are a world-class product designer + design engineer. Design ONE flagship screen for ${screenLabel(input)} in the "${direction}" design system — the single screen that best shows the product (e.g. the landing/hero, or the main app screen). It must look like a top studio made it.

DIRECTION: ${direction} — ${system.personality}
FONTS: display "${system.typography.displayFont}", body "${system.typography.bodyFont}", mono "${system.typography.monoFont}". STYLE: ${system.spacingNote}; ${system.motionNote}.
${exemplar}
${DESIGN_PRINCIPLES}

${DESIGN_RUBRIC}

${TOKEN_RULES}
${FRAGMENT_RULES}

Aim for 85+ on the rubric on the FIRST try. Return ONLY this format, nothing else:
<<<NAME>>>
<short screen name, e.g. Landing>
<<<HTML>>>
<style>...</style>
<section class="...">...</section>`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No screen generated");
  return parseScreen(block.text, input);
}

/** Revise the screen by applying a visual critique (feedback-injection pattern). */
export async function reviseScreen(
  current: DesignScreen,
  critique: DesignCritique,
  system: DesignSystem,
  input: PolishInput
): Promise<DesignScreen> {
  const client = getAnthropicClient();
  const fixes = critique.issues.map((i) => `- [${i.area}] ${i.problem} → ${i.fix}`).join("\n");

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are a senior design engineer. A design director reviewed the RENDERED screen and scored it ${critique.score}/100${critique.looksAI ? " and flagged it as still looking AI-generated" : ""}. Apply EVERY fix below and return the improved screen. Keep what works; raise it above 85.

DESIGN SYSTEM: "${system.direction}" — fonts ${system.typography.displayFont}/${system.typography.bodyFont}; ${system.spacingNote}.

DIRECTOR'S FIXES:
${fixes || critique.verdict}

${DESIGN_RUBRIC}

${TOKEN_RULES}
${FRAGMENT_RULES}

CURRENT SCREEN (improve this exact screen — same purpose, same content, better execution):
${current.html.slice(0, 9000)}

Return ONLY this format, nothing else:
<<<NAME>>>
${current.name}
<<<HTML>>>
<style>...</style>
<section class="...">...</section>`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") return current;
  try {
    return parseScreen(block.text, input, current.name);
  } catch {
    return current;
  }
}

function parseScreen(text: string, input: PolishInput, fallbackName?: string): DesignScreen {
  const nameMatch = /<<<NAME>>>\s*([\s\S]*?)\s*<<<HTML>>>/.exec(text);
  const htmlMatch = /<<<HTML>>>\s*([\s\S]*)$/.exec(text);
  const html = sanitizeScreenHtml(htmlMatch ? htmlMatch[1] : text);
  if (!html.includes("<") || html.length < 40) throw new Error("Empty screen output");
  const name = (nameMatch?.[1]?.trim() || fallbackName || input.name || "Screen").slice(0, 60);
  return { name, html };
}
