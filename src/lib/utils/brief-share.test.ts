import { describe, it, expect, beforeAll } from "vitest";
import { encodeBriefShare, decodeBriefShare, buildBriefShareUrl } from "./share";
import { exportBriefMarkdown } from "./export-markdown";
import type { BriefResult } from "@/types/brief";

beforeAll(() => {
  if (typeof globalThis.btoa === "undefined") {
    globalThis.btoa = (s: string) => Buffer.from(s, "binary").toString("base64");
    globalThis.atob = (s: string) => Buffer.from(s, "base64").toString("binary");
  }
});

const result: BriefResult = {
  goal: "Build ContextOS",
  targetUser: "founders",
  problem: "bad AI context",
  corePromise: "vague idea → perfect brief",
  mvpFeatures: ["projects", "5 questions"],
  nonGoals: ["no team accounts"],
  userFlow: "1. paste\n2. answer\n3. copy",
  techStack: "Next.js",
  dbNeeds: "projects table",
  aiBehavior: "fewest questions",
  buildTickets: [{ title: "Shell", description: "scaffold", priority: "high" }],
  validationChecklist: ["generates a brief"],
  briefMarkdown: "# Build ContextOS\n\nbody — café 日本語",
  prompts: {
    codex: "CODEX PROMPT",
    claude: "CLAUDE PROMPT",
    chatgpt: "CHATGPT PROMPT",
    cursor: "CURSOR PROMPT",
    generic: "GENERIC PROMPT",
  },
};

describe("brief share encode/decode", () => {
  it("round-trips a full brief result", () => {
    const encoded = encodeBriefShare({ result });
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = decodeBriefShare(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.result.goal).toBe(result.goal);
    expect(decoded!.result.prompts.cursor).toBe("CURSOR PROMPT");
  });

  it("preserves unicode in the markdown", () => {
    const decoded = decodeBriefShare(encodeBriefShare({ result }));
    expect(decoded!.result.briefMarkdown).toContain("café 日本語");
  });

  it("returns null on malformed input", () => {
    expect(decodeBriefShare("@@@nope@@@")).toBeNull();
    expect(decodeBriefShare("")).toBeNull();
  });

  it("builds a hash-fragment share URL", () => {
    expect(buildBriefShareUrl("https://x.app", "ABC")).toBe("https://x.app/brief#b=ABC");
  });
});

describe("exportBriefMarkdown", () => {
  it("includes the brief body and every tool prompt", () => {
    const md = exportBriefMarkdown(result);
    expect(md).toContain("# Build ContextOS");
    expect(md).toContain("## AI Build Prompts");
    for (const label of ["Codex", "Claude", "ChatGPT", "Cursor", "Any AI agent"]) {
      expect(md).toContain(`### ${label}`);
    }
    expect(md).toContain("CODEX PROMPT");
    expect(md).toContain("GENERIC PROMPT");
  });
});
