import { describe, it, expect } from "vitest";
import { wrapForTool, buildBlueprintMarkdown } from "./blueprint-compile";

// A CompiledBlueprint-shaped fixture (the interface is internal; structural typing
// lets us pass a matching object literal).
const blueprint = {
  goal: "Build ContextOS, a context compiler for AI tools",
  targetUser: "non-technical founders",
  problem: "people give AI bad context",
  corePromise: "turn a vague idea into a perfect execution blueprint",
  mvpFeatures: ["create a project", "ask 5 questions", "generate a blueprint"],
  nonGoals: ["no Gmail integration", "no team accounts"],
  userFlow: "1. paste idea\n2. answer questions\n3. copy blueprint",
  techStack: "Next.js, Tailwind, Supabase",
  dbNeeds: "projects and blueprints tables",
  aiBehavior: "ask the fewest questions needed",
  buildTickets: [
    { title: "App shell", description: "scaffold pages", priority: "high" as const },
  ],
  validationChecklist: ["the blueprint generates", "prompts copy cleanly"],
  buildPrompt: "Build an MVP web app called ContextOS with these pages...",
};

describe("wrapForTool", () => {
  it("includes the build prompt and blueprint goal for every target", () => {
    for (const tool of ["codex", "claude", "chatgpt", "cursor", "generic"] as const) {
      const out = wrapForTool(blueprint.buildPrompt, blueprint, tool);
      expect(out).toContain(blueprint.buildPrompt);
      expect(out).toContain(blueprint.goal);
      expect(out).toContain("BUILD INSTRUCTIONS");
    }
  });

  it("applies tool-specific framing", () => {
    expect(wrapForTool(blueprint.buildPrompt, blueprint, "codex")).toContain("Codex");
    expect(wrapForTool(blueprint.buildPrompt, blueprint, "claude")).toContain("Claude");
    expect(wrapForTool(blueprint.buildPrompt, blueprint, "cursor")).toContain("Cursor");
  });

  it("includes the validation checklist as definition of done", () => {
    const out = wrapForTool(blueprint.buildPrompt, blueprint, "generic");
    expect(out).toContain("DEFINITION OF DONE");
    expect(out).toContain("the blueprint generates");
  });
});

describe("buildBlueprintMarkdown", () => {
  it("renders all sections with their content", () => {
    const md = buildBlueprintMarkdown(blueprint);
    expect(md).toContain(`# ${blueprint.goal}`);
    expect(md).toContain("## MVP Features");
    expect(md).toContain("- create a project");
    expect(md).toContain("## Non-Goals");
    expect(md).toContain("## Build Tickets");
    expect(md).toContain("**App shell**");
    expect(md).toContain("## Validation Checklist");
  });

  it("shows a placeholder for empty lists", () => {
    const md = buildBlueprintMarkdown({ ...blueprint, nonGoals: [], mvpFeatures: [] });
    expect(md).toContain("_None specified._");
    // Header still renders even with no features.
    expect(md).toContain("## MVP Features");
  });
});
