import { getAnthropicClient } from "@/lib/ai/client";
import { DESIGN_SYSTEM_BRIEF, AI_SLOP_MARKERS } from "@/lib/ai/design-knowledge";
import {
  COLOR_ROLES,
  type DesignColors,
  type DesignSystem,
  type DesignTokens,
  type DesignTypography,
  type PolishInput,
  type PromptTarget,
} from "@/types/polish";

// Polish compiler: Sonnet generates the design system; a Haiku anti-slop pass
// pushes generic choices to be distinctive; pure functions serialize the tokens,
// the DESIGN.md, and the per-tool "apply this design system" prompts.

function parseClaudeJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[{[]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new Error("The model returned an incomplete response. Please try again.");
  }
}

/** What Sonnet returns — DesignSystem minus the derived tokens/markdown/prompts. */
interface CompiledDesign {
  personality: string;
  typography: DesignTypography;
  colors: { light: DesignColors; dark: DesignColors };
  radius: string;
  spacingNote: string;
  motionNote: string;
  components: { name: string; notes: string }[];
  antiSlopChecklist: string[];
  /** Canonical, tool-agnostic directive for how to style the product. */
  stylePrompt: string;
}

/* ── Pure serializers (no AI, fully testable) ───────────────────────────── */

function kebab(role: string): string {
  return role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function colorVars(colors: DesignColors, indent = "  "): string {
  return COLOR_ROLES.map((role) => `${indent}--${kebab(role)}: ${colors[role]};`).join("\n");
}

export function buildCssTokens(d: CompiledDesign): string {
  return [
    `:root {`,
    colorVars(d.colors.light),
    `  --radius: ${d.radius};`,
    `  --font-display: "${d.typography.displayFont}", serif;`,
    `  --font-body: "${d.typography.bodyFont}", system-ui, sans-serif;`,
    `  --font-mono: "${d.typography.monoFont}", ui-monospace, monospace;`,
    `}`,
    ``,
    `.dark {`,
    colorVars(d.colors.dark),
    `}`,
  ].join("\n");
}

export function buildTailwindTokens(d: CompiledDesign): string {
  const themeVars = COLOR_ROLES.map((role) => `  --color-${kebab(role)}: ${d.colors.light[role]};`).join("\n");
  const darkVars = COLOR_ROLES.map((role) => `  --color-${kebab(role)}: ${d.colors.dark[role]};`).join("\n");
  return [
    `@theme {`,
    themeVars,
    `  --radius-lg: ${d.radius};`,
    `  --font-display: "${d.typography.displayFont}", serif;`,
    `  --font-sans: "${d.typography.bodyFont}", system-ui, sans-serif;`,
    `  --font-mono: "${d.typography.monoFont}", ui-monospace, monospace;`,
    `}`,
    ``,
    `.dark {`,
    darkVars,
    `}`,
  ].join("\n");
}

export function buildJsonTokens(d: CompiledDesign): string {
  return JSON.stringify(
    {
      colors: { light: d.colors.light, dark: d.colors.dark },
      radius: d.radius,
      fonts: {
        display: d.typography.displayFont,
        body: d.typography.bodyFont,
        mono: d.typography.monoFont,
      },
      type: d.typography.scale,
    },
    null,
    2
  );
}

function buildTokens(d: CompiledDesign): DesignTokens {
  return { tailwind: buildTailwindTokens(d), css: buildCssTokens(d), json: buildJsonTokens(d) };
}

export function buildDesignMd(d: CompiledDesign, direction: string): string {
  const swatches = COLOR_ROLES.map((r) => `| \`${r}\` | \`${d.colors.light[r]}\` | \`${d.colors.dark[r]}\` |`).join("\n");
  const type = d.typography.scale.map((t) => `- **${t.name}** — ${t.size}, weight ${t.weight}`).join("\n");
  const comps = d.components.length
    ? d.components.map((c) => `- **${c.name}** — ${c.notes}`).join("\n")
    : "_Use the tokens above for all components._";
  const rules = d.antiSlopChecklist.length ? d.antiSlopChecklist.map((c) => `- ${c}`).join("\n") : "";

  return [
    `# DESIGN.md`,
    ``,
    `> Design system for **${direction}**. Hand this to any AI coding agent so it builds on-brand, not generic.`,
    ``,
    `**Personality:** ${d.personality}`,
    ``,
    `## Typography`,
    `- **Display:** ${d.typography.displayFont}`,
    `- **Body:** ${d.typography.bodyFont}`,
    `- **Mono:** ${d.typography.monoFont}`,
    ``,
    type,
    ``,
    `## Color tokens`,
    ``,
    `| Role | Light | Dark |`,
    `| --- | --- | --- |`,
    swatches,
    ``,
    `## Shape & motion`,
    `- **Radius:** ${d.radius}`,
    `- **Spacing:** ${d.spacingNote}`,
    `- **Motion:** ${d.motionNote}`,
    ``,
    `## Components`,
    comps,
    ``,
    `## Anti-AI-slop rules`,
    rules,
    ``,
    `## CSS variables`,
    ``,
    "```css",
    buildCssTokens(d),
    "```",
  ].join("\n");
}

const TOOL_FRAMING: Record<PromptTarget, string> = {
  codex:
    "You are Codex. Restyle / build this product to match the design system below exactly. Apply the tokens, load the fonts, and follow every anti-slop rule. After editing, say how to run it.",
  claude:
    "You are Claude, a senior design engineer. Apply the design system below to this product precisely — wire the tokens into the theme, load the fonts, and obey every anti-slop rule. Keep components consistent.",
  chatgpt:
    "Act as an expert design engineer. Apply this design system to the product: set up the tokens, load the fonts, and follow each anti-slop rule. Provide complete, runnable code.",
  cursor:
    "You are an AI pair programmer in Cursor. Apply the design system below across the codebase: add the tokens to the theme, load the fonts, and refactor components to match. Keep changes scoped and runnable.",
  generic:
    "You are an AI design engineer. Apply the design system below to this product: install the tokens, load the fonts, and follow every anti-slop rule so the result looks designed, not AI-generated.",
};

/** ── Pure: wrap the style directive + tokens into a per-tool prompt. ── */
export function wrapForTool(d: CompiledDesign, direction: string, tool: PromptTarget): string {
  return [
    TOOL_FRAMING[tool],
    ``,
    `=== DESIGN DIRECTION: ${direction} ===`,
    d.personality,
    ``,
    `=== HOW TO STYLE IT ===`,
    d.stylePrompt,
    ``,
    `=== FONTS (load from Google Fonts) ===`,
    `Display: ${d.typography.displayFont} · Body: ${d.typography.bodyFont} · Mono: ${d.typography.monoFont}`,
    ``,
    `=== DESIGN TOKENS (paste into your CSS / theme) ===`,
    buildCssTokens(d),
    ``,
    `=== HARD RULES (never violate) ===`,
    (d.antiSlopChecklist.length
      ? d.antiSlopChecklist
      : ["No default shadcn violet.", "Use the display + body font pairing above, not Inter for everything.", "Intentional radius and spacing rhythm, not uniform rounded-lg."]
    )
      .map((r) => `- ${r}`)
      .join("\n"),
  ].join("\n");
}

function buildAllPrompts(d: CompiledDesign, direction: string): Record<PromptTarget, string> {
  const targets: PromptTarget[] = ["codex", "claude", "chatgpt", "cursor", "generic"];
  return targets.reduce(
    (acc, t) => {
      acc[t] = wrapForTool(d, direction, t);
      return acc;
    },
    {} as Record<PromptTarget, string>
  );
}

/* ── AI generation ──────────────────────────────────────────────────────── */

function roleList(): string {
  return COLOR_ROLES.join(", ");
}

async function generate(input: PolishInput, direction: string): Promise<CompiledDesign> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are a world-class design engineer. Produce a complete, characterful design system for this product in the chosen direction. It must look intentionally DESIGNED — never the default "AI" look.

PRODUCT: ${input.name || "(unnamed)"} — ${input.productType}
AUDIENCE: ${input.audience || "(general)"}
VIBE: ${input.vibe || "(infer from the product)"}
CHOSEN DIRECTION: ${direction}

${DESIGN_SYSTEM_BRIEF}

Requirements:
- Pick a DISTINCTIVE display + body font pairing (real Google Fonts). Not Inter-for-everything.
- Design a real color system as hex. Provide ALL of these roles for BOTH light and dark: ${roleList()}.
  Neutrals must be tinted (warm or cool), never pure gray. Ensure AA contrast. Dark mode uses elevated
  surfaces, not pure black. The primary must NOT be the default shadcn violet (#6366f1 / #7c3aed) unless the
  product genuinely demands it.
- Give a base radius, a spacing note, and a motion note.
- List 4-6 key components with one-line styling notes (button, input, card, nav, badge, etc.).
- Write an "antiSlopChecklist" of 5-7 product-specific rules that keep THIS design distinctive.
- Write a "stylePrompt": a tight, concrete directive an agent can follow to style the whole app this way.

Return ONLY valid JSON, no markdown, in exactly this shape:
{
  "personality": "<one sentence>",
  "typography": {
    "displayFont": "<Google font>", "bodyFont": "<Google font>", "monoFont": "<Google mono font>",
    "googleFonts": ["<family>", "..."],
    "scale": [ { "name": "Display", "size": "48px", "weight": 600 }, { "name": "H1", "size": "32px", "weight": 600 }, { "name": "Body", "size": "16px", "weight": 400 }, { "name": "Small", "size": "13px", "weight": 500 } ]
  },
  "colors": {
    "light": { ${COLOR_ROLES.map((r) => `"${r}": "#hex"`).join(", ")} },
    "dark":  { ${COLOR_ROLES.map((r) => `"${r}": "#hex"`).join(", ")} }
  },
  "radius": "0.625rem",
  "spacingNote": "<the spacing system in one line>",
  "motionNote": "<the motion language in one line>",
  "components": [ { "name": "Button", "notes": "<one line>" } ],
  "antiSlopChecklist": ["<rule>", "..."],
  "stylePrompt": "<concrete directive to style the whole app this way>"
}`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No design generated");
  return parseClaudeJSON<CompiledDesign>(block.text);
}

/** Anti-slop validation: catch generic choices and push them to be distinctive. */
async function validate(d: CompiledDesign): Promise<CompiledDesign> {
  const client = getAnthropicClient();
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Audit this design system for "AI slop". If the primary color is the default shadcn violet/indigo, or the fonts are Inter/system for everything, or neutrals are pure gray, FIX them to be distinctive while keeping the same direction. Otherwise return them unchanged.

${AI_SLOP_MARKERS}

CURRENT: primary(light)=${d.colors.light.primary}, fonts=${d.typography.displayFont}/${d.typography.bodyFont}, background(light)=${d.colors.light.background}, background(dark)=${d.colors.dark.background}

Return ONLY valid JSON, no markdown:
{ "primaryLight": "#hex", "primaryDark": "#hex", "displayFont": "<font>", "bodyFont": "<font>" }`,
        },
      ],
    });
    const block = res.content[0];
    if (block && block.type === "text") {
      const fix = parseClaudeJSON<{ primaryLight: string; primaryDark: string; displayFont: string; bodyFont: string }>(block.text);
      if (fix.primaryLight?.startsWith("#")) d.colors.light.primary = fix.primaryLight;
      if (fix.primaryDark?.startsWith("#")) d.colors.dark.primary = fix.primaryDark;
      if (fix.displayFont) d.typography.displayFont = fix.displayFont;
      if (fix.bodyFont) d.typography.bodyFont = fix.bodyFont;
    }
  } catch {
    // best-effort
  }
  return d;
}

/** Full compile: design system + tokens + DESIGN.md + universal prompts. */
export async function compilePolish(input: PolishInput, direction: string): Promise<DesignSystem> {
  const raw = await generate(input, direction);
  const d = await validate(raw);
  return {
    direction,
    personality: d.personality,
    typography: d.typography,
    colors: d.colors,
    radius: d.radius,
    spacingNote: d.spacingNote,
    motionNote: d.motionNote,
    components: d.components,
    antiSlopChecklist: d.antiSlopChecklist,
    designMd: buildDesignMd(d, direction),
    tokens: buildTokens(d),
    prompts: buildAllPrompts(d, direction),
  };
}
