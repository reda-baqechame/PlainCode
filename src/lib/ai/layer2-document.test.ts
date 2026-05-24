import { describe, it, expect } from "vitest";
import { buildDocumentSystemPrompt, buildDocumentUserPrompt } from "./layer2-document";

describe("buildDocumentSystemPrompt", () => {
  const sys = buildDocumentSystemPrompt();

  it("declares all twelve section delimiters", () => {
    for (const s of [
      "TITLE", "OVERVIEW", "PURPOSE", "API", "STEPS",
      "FLOWCHART", "SEQUENCE", "DATAFLOW", "EXAMPLE",
      "EDGECASES", "COMPLEXITY", "ANNOTATIONS",
    ]) {
      expect(sys).toContain(`<!-- SECTION:${s} -->`);
    }
  });

  it("pins each diagram to its required mermaid prefix", () => {
    expect(sys).toContain("flowchart TD");
    expect(sys).toContain("sequenceDiagram");
    expect(sys).toContain("flowchart LR");
  });
});

describe("buildDocumentUserPrompt — snippet mode", () => {
  const p = buildDocumentUserPrompt("const x = 1;", "adds numbers", "English", "TypeScript", false);

  it("includes the code and inferred purpose", () => {
    expect(p).toContain("const x = 1;");
    expect(p).toContain("adds numbers");
  });

  it("does not include repo-specific guidance", () => {
    expect(p).not.toContain("PROJECT-LEVEL");
    expect(p).not.toContain("// FILE:");
  });
});

describe("buildDocumentUserPrompt — repo mode", () => {
  const repoCode = "// FILE: src/a.ts\nexport const a = 1;\n// FILE: src/b.ts\nexport const b = 2;";
  const p = buildDocumentUserPrompt(repoCode, "a small lib", "English", "TypeScript", true);

  it("switches to project-level guidance", () => {
    expect(p).toContain("PROJECT-LEVEL");
    expect(p).toContain("// FILE:");
  });

  it("instructs ANNOTATIONS to be empty for repos", () => {
    expect(p).toMatch(/ANNOTATIONS: return an empty section/i);
  });

  it("still requires all twelve sections", () => {
    expect(p).toContain("All twelve sections are required");
  });

  it("allows a larger code budget than snippet mode", () => {
    const big = "// FILE: x\n" + "y".repeat(20000);
    const out = buildDocumentUserPrompt(big, "x", "English", "TypeScript", true);
    // 8000-char snippet cap would have dropped most of this; repo cap is 30k.
    expect(out.length).toBeGreaterThan(15000);
  });
});
