import { describe, it, expect } from "vitest";
import { buildCssTokens, buildTailwindTokens, buildJsonTokens, buildDesignMd, wrapForTool } from "./polish-compile";
import { COLOR_ROLES, type DesignColors } from "@/types/polish";

function colors(seed: string): DesignColors {
  return COLOR_ROLES.reduce((acc, r, i) => {
    acc[r] = `#${seed}${i.toString(16).padStart(2, "0")}`;
    return acc;
  }, {} as DesignColors);
}

// CompiledDesign-shaped fixture (the interface is internal; structural typing).
const design = {
  personality: "Calm, clinical, trustworthy.",
  typography: {
    displayFont: "Fraunces",
    bodyFont: "Inter Tight",
    monoFont: "JetBrains Mono",
    googleFonts: ["Fraunces", "Inter Tight"],
    scale: [{ name: "Display", size: "48px", weight: 600 }],
  },
  colors: { light: colors("a1"), dark: colors("0f") },
  radius: "0.625rem",
  spacingNote: "4px base grid",
  motionNote: "160ms ease-out",
  components: [{ name: "Button", notes: "pill, primary fill" }],
  antiSlopChecklist: ["No default violet", "Use Fraunces for display"],
  stylePrompt: "Style the app calm and clinical with generous whitespace.",
};

describe("token serializers", () => {
  it("buildCssTokens emits :root and .dark with kebab-cased vars", () => {
    const css = buildCssTokens(design);
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");
    expect(css).toContain("--card-foreground:");
    expect(css).toContain("--radius: 0.625rem;");
    expect(css).toContain('--font-display: "Fraunces"');
  });
  it("buildTailwindTokens emits @theme with --color- prefixes", () => {
    const tw = buildTailwindTokens(design);
    expect(tw).toContain("@theme {");
    expect(tw).toContain("--color-primary:");
    expect(tw).toContain("--color-primary-foreground:");
  });
  it("buildJsonTokens is valid JSON with colors + fonts", () => {
    const parsed = JSON.parse(buildJsonTokens(design));
    expect(parsed.colors.light.primary).toBe(design.colors.light.primary);
    expect(parsed.fonts.display).toBe("Fraunces");
  });
});

describe("buildDesignMd", () => {
  it("renders the DESIGN.md with fonts, swatches, and rules", () => {
    const md = buildDesignMd(design, "Clinical Calm");
    expect(md).toContain("# DESIGN.md");
    expect(md).toContain("Clinical Calm");
    expect(md).toContain("Fraunces");
    expect(md).toContain("No default violet");
    expect(md).toContain("## Color tokens");
  });
});

describe("wrapForTool", () => {
  it("includes the style directive, tokens, and rules for every target", () => {
    for (const tool of ["codex", "claude", "chatgpt", "cursor", "generic"] as const) {
      const out = wrapForTool(design, "Clinical Calm", tool);
      expect(out).toContain("Clinical Calm");
      expect(out).toContain(design.stylePrompt);
      expect(out).toContain("--primary:");
      expect(out).toContain("No default violet");
    }
  });
});
