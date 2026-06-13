import { describe, it, expect } from "vitest";
import { wrapForTool, buildBriefMarkdown } from "./brief-compile";

// A CompiledBrief-shaped fixture (the interface is internal; structural typing
// lets us pass a matching object literal).
const brief = {
  goal: "Build ContextOS, a context compiler for AI tools",
  targetUser: "non-technical founders",
  problem: "people give AI bad context",
  corePromise: "turn a vague idea into a perfect execution brief",
  mvpFeatures: ["create a project", "ask 5 questions", "generate a brief"],
  nonGoals: ["no Gmail integration", "no team accounts"],
  userFlow: "1. paste idea\n2. answer questions\n3. copy brief",
  techStack: "Next.js, Tailwind, Supabase",
  dbNeeds: "projects and briefs tables",
  aiBehavior: "ask the fewest questions needed",
  buildTickets: [
    { title: "App shell", description: "scaffold pages", priority: "high" as const },
  ],
  validationChecklist: ["the brief generates", "prompts copy cleanly"],
  buildPrompt: "Build an MVP web app called ContextOS with these pages...",
};

describe("wrapForTool", () => {
  it("includes the build prompt and brief goal for every target", () => {
    for (const tool of ["codex", "claude", "chatgpt", "cursor", "generic"] as const) {
      const out = wrapForTool(brief.buildPrompt, brief, tool);
      expect(out).toContain(brief.buildPrompt);
      expect(out).toContain(brief.goal);
      expect(out).toContain("BUILD INSTRUCTIONS");
    }
  });

  it("applies tool-specific framing", () => {
    expect(wrapForTool(brief.buildPrompt, brief, "codex")).toContain("Codex");
    expect(wrapForTool(brief.buildPrompt, brief, "claude")).toContain("Claude");
    expect(wrapForTool(brief.buildPrompt, brief, "cursor")).toContain("Cursor");
  });

  it("includes the validation checklist as definition of done", () => {
    const out = wrapForTool(brief.buildPrompt, brief, "generic");
    expect(out).toContain("DEFINITION OF DONE");
    expect(out).toContain("the brief generates");
  });
});

describe("buildBriefMarkdown", () => {
  it("renders all sections with their content", () => {
    const md = buildBriefMarkdown(brief);
    expect(md).toContain(`# ${brief.goal}`);
    expect(md).toContain("## MVP Features");
    expect(md).toContain("- create a project");
    expect(md).toContain("## Non-Goals");
    expect(md).toContain("## Build Tickets");
    expect(md).toContain("**App shell**");
    expect(md).toContain("## Validation Checklist");
  });

  it("shows a placeholder for empty lists", () => {
    const md = buildBriefMarkdown({ ...brief, nonGoals: [] });
    expect(md).toContain("_None specified._");
  });
});
