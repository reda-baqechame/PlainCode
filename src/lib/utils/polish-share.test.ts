import { describe, it, expect, beforeAll } from "vitest";
import { encodePolishShare, decodePolishShare, buildPolishShareUrl } from "./share";
import { exportPolishMarkdown } from "./export-markdown";
import { COLOR_ROLES, type DesignColors, type PolishResult } from "@/types/polish";

beforeAll(() => {
  if (typeof globalThis.btoa === "undefined") {
    globalThis.btoa = (s: string) => Buffer.from(s, "binary").toString("base64");
    globalThis.atob = (s: string) => Buffer.from(s, "base64").toString("binary");
  }
});

const c = COLOR_ROLES.reduce((a, r) => ((a[r] = "#101010"), a), {} as DesignColors);

const result: PolishResult = {
  name: "Lumen",
  direction: "Clinical Calm",
  personality: "Calm, clinical — café 日本語",
  typography: { displayFont: "Fraunces", bodyFont: "Inter Tight", monoFont: "JetBrains Mono", googleFonts: ["Fraunces"], scale: [{ name: "Body", size: "16px", weight: 400 }] },
  colors: { light: c, dark: c },
  radius: "0.625rem",
  spacingNote: "4px grid",
  motionNote: "160ms",
  components: [{ name: "Button", notes: "pill" }],
  antiSlopChecklist: ["No default violet"],
  designMd: "# DESIGN.md\n\nCalm — café 日本語",
  tokens: { tailwind: "@theme {}", css: ":root {}", json: "{}" },
  prompts: { codex: "CODEX", claude: "CLAUDE", chatgpt: "CHATGPT", cursor: "CURSOR", generic: "GENERIC" },
  screens: [{ name: "Landing", html: "<section>hi</section>" }],
  critiqueTrail: [
    { score: 62, looksAI: true, issues: [], verdict: "cramped" },
    { score: 89, looksAI: false, issues: [], verdict: "sharp" },
  ],
};

describe("polish share encode/decode", () => {
  it("round-trips a full polish result incl. screens + unicode", () => {
    const decoded = decodePolishShare(encodePolishShare({ result }));
    expect(decoded).not.toBeNull();
    expect(decoded!.result.direction).toBe("Clinical Calm");
    expect(decoded!.result.screens[0].html).toContain("<section>");
    expect(decoded!.result.personality).toContain("café 日本語");
  });
  it("returns null on malformed input", () => {
    expect(decodePolishShare("@@@")).toBeNull();
    expect(decodePolishShare("")).toBeNull();
  });
  it("builds a hash-fragment share URL", () => {
    expect(buildPolishShareUrl("https://x.app", "ABC")).toBe("https://x.app/polish#ps=ABC");
  });
});

describe("exportPolishMarkdown", () => {
  it("includes the DESIGN.md, tokens, quality passes, screens, and prompts", () => {
    const md = exportPolishMarkdown(result);
    expect(md).toContain("# DESIGN.md");
    expect(md).toContain("## Design Tokens");
    expect(md).toContain("## Quality passes");
    expect(md).toContain("Pass 2: 89/100");
    expect(md).toContain("## Rendered Screens");
    expect(md).toContain("### Landing");
    expect(md).toContain("CODEX");
    expect(md).toContain("GENERIC");
  });
});
