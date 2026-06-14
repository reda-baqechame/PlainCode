import { getAnthropicClient } from "@/lib/ai/client";
import { DESIGN_PRINCIPLES } from "@/lib/ai/design-knowledge";
import type { DesignScreen, DesignSystem, PolishInput } from "@/types/polish";

// Polish renderer: Sonnet generates real, beautiful screens as self-contained
// HTML. We use a DELIMITER format (not JSON) so large HTML can't break parsing
// and a truncated response still yields the screens that completed. Output is
// sanitized and rendered in a sandboxed iframe.

/** ── Pure: strip scripts / handlers / js: URLs and any document wrapper. ── */
export function sanitizeScreenHtml(html: string): string {
  return html
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

/** ── Pure: parse the delimiter format into screens. ── */
export function parseScreens(text: string): DesignScreen[] {
  const re = /<<<SCREEN:\s*(.+?)\s*>>>([\s\S]*?)(?=<<<SCREEN:|<<<END>>>|$)/g;
  const screens: DesignScreen[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    const html = sanitizeScreenHtml(m[2]);
    // Keep only screens that actually produced markup (drop a truncated tail).
    if (html.includes("<") && html.length > 40) screens.push({ name, html });
  }
  return screens.slice(0, 3);
}

export async function renderScreens(input: PolishInput, system: DesignSystem): Promise<DesignScreen[]> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: `You are a world-class design engineer. Produce 3 STUNNING, real screens for this product as self-contained HTML fragments, in the "${system.direction}" design system. They must look like a top studio designed them — not AI-generated.

PRODUCT: ${input.name || "(unnamed)"} — ${input.productType}
AUDIENCE: ${input.audience || "(general)"}
DIRECTION: ${system.direction} — ${system.personality}
STYLE: ${system.spacingNote}; ${system.motionNote}
FONTS: display "${system.typography.displayFont}", body "${system.typography.bodyFont}", mono "${system.typography.monoFont}".

${DESIGN_PRINCIPLES}

RULES FOR EACH SCREEN:
- A self-contained HTML FRAGMENT: its own <style> (scoped via a unique root class) followed by a <section>/<div>. NO <html>, <head>, <body>, or <!doctype>.
- Use ONLY these CSS variables for color (injected by the host — never redefine, never hardcode hex): var(--background) var(--foreground) var(--card) var(--card-foreground) var(--primary) var(--primary-foreground) var(--secondary) var(--muted) var(--muted-foreground) var(--accent) var(--border) var(--ring) var(--destructive) var(--success). Also var(--radius) var(--font-display) var(--font-body) var(--font-mono).
- Real, human copy for THIS product. Inline SVG icons (never emoji). Responsive (clamp/flex/grid). Hover/focus states.
- NO <script>, no external JS, no external images. Keep each screen FOCUSED — one strong viewport (~90–160 lines).
- Pick the 3 best screens (e.g. landing/hero, the main app/dashboard, and one of pricing/auth/settings).

OUTPUT EXACTLY THIS FORMAT — no JSON, no prose, no code fences:
<<<SCREEN: Landing>>>
<style>...</style>
<section class="...">...</section>
<<<SCREEN: Dashboard>>>
<style>...</style>
<section class="...">...</section>
<<<SCREEN: Pricing>>>
<style>...</style>
<section class="...">...</section>
<<<END>>>`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No screens generated");
  const screens = parseScreens(block.text);
  if (screens.length === 0) throw new Error("No screens generated");
  return screens;
}
