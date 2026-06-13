import { describe, it, expect, beforeAll } from "vitest";
import { encodeBlueprintShare, decodeBlueprintShare, buildBlueprintShareUrl } from "./share";
import { exportBlueprintMarkdown } from "./export-markdown";
import type { BlueprintResult } from "@/types/blueprint";

beforeAll(() => {
  if (typeof globalThis.btoa === "undefined") {
    globalThis.btoa = (s: string) => Buffer.from(s, "binary").toString("base64");
    globalThis.atob = (s: string) => Buffer.from(s, "base64").toString("binary");
  }
});

const result: BlueprintResult = {
  goal: "Build ContextOS",
  targetUser: "founders",
  problem: "bad AI context",
  corePromise: "vague idea → perfect blueprint",
  mvpFeatures: ["projects", "5 questions"],
  nonGoals: ["no team accounts"],
  userFlow: "1. paste\n2. answer\n3. copy",
  techStack: "Next.js",
  dbNeeds: "projects table",
  aiBehavior: "fewest questions",
  buildTickets: [{ title: "Shell", description: "scaffold", priority: "high" }],
  validationChecklist: ["generates a blueprint"],
  blueprintMarkdown: "# Build ContextOS\n\nbody — café 日本語",
  prompts: {
    codex: "CODEX PROMPT",
    claude: "CLAUDE PROMPT",
    chatgpt: "CHATGPT PROMPT",
    cursor: "CURSOR PROMPT",
    generic: "GENERIC PROMPT",
  },
};

describe("blueprint share encode/decode", () => {
  it("round-trips a full blueprint result", () => {
    const encoded = encodeBlueprintShare({ result });
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = decodeBlueprintShare(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.result.goal).toBe(result.goal);
    expect(decoded!.result.prompts.cursor).toBe("CURSOR PROMPT");
  });

  it("preserves unicode in the markdown", () => {
    const decoded = decodeBlueprintShare(encodeBlueprintShare({ result }));
    expect(decoded!.result.blueprintMarkdown).toContain("café 日本語");
  });

  it("returns null on malformed input", () => {
    expect(decodeBlueprintShare("@@@nope@@@")).toBeNull();
    expect(decodeBlueprintShare("")).toBeNull();
  });

  it("builds a hash-fragment share URL", () => {
    expect(buildBlueprintShareUrl("https://x.app", "ABC")).toBe("https://x.app/blueprint#bp=ABC");
  });
});

describe("exportBlueprintMarkdown", () => {
  it("includes the blueprint body and every tool prompt", () => {
    const md = exportBlueprintMarkdown(result);
    expect(md).toContain("# Build ContextOS");
    expect(md).toContain("## AI Build Prompts");
    for (const label of ["Codex", "Claude", "ChatGPT", "Cursor", "Any AI agent"]) {
      expect(md).toContain(`### ${label}`);
    }
    expect(md).toContain("CODEX PROMPT");
    expect(md).toContain("GENERIC PROMPT");
  });
});
