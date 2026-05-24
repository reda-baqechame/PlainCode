import { describe, it, expect } from "vitest";
import { parseSections } from "./pipeline";

const DOC_SECTIONS = [
  "TITLE", "OVERVIEW", "PURPOSE", "API", "STEPS",
  "FLOWCHART", "SEQUENCE", "DATAFLOW", "EXAMPLE",
  "EDGECASES", "COMPLEXITY", "ANNOTATIONS",
];

function delim(name: string) {
  return `<!-- SECTION:${name} -->`;
}

describe("parseSections — explain (default 6 sections)", () => {
  it("returns all-empty sections for empty input", () => {
    expect(parseSections("")).toEqual({
      SUMMARY: "", BREAKDOWN: "", ANALOGY: "", DATAMAP: "", SYSTEMS: "", MERMAID: "",
    });
  });

  it("falls back to SUMMARY when no delimiters present", () => {
    const r = parseSections("just prose");
    expect(r.SUMMARY).toBe("just prose");
    expect(r.MERMAID).toBe("");
  });

  it("parses every section in order", () => {
    const txt = [
      delim("SUMMARY"), "s",
      delim("BREAKDOWN"), "b",
      delim("ANALOGY"), "a",
      delim("DATAMAP"), "d",
      delim("SYSTEMS"), "sys",
      delim("MERMAID"), "flowchart TD",
    ].join("\n");
    const r = parseSections(txt);
    expect(r.SUMMARY).toBe("s");
    expect(r.BREAKDOWN).toBe("b");
    expect(r.MERMAID).toBe("flowchart TD");
  });
});

describe("parseSections — gap handling (regression)", () => {
  it("does not let an earlier section swallow later ones when a middle section is missing", () => {
    const txt = [delim("SUMMARY"), "S", delim("MERMAID"), "flowchart TD"].join("\n");
    const r = parseSections(txt);
    expect(r.SUMMARY).toBe("S");
    expect(r.BREAKDOWN).toBe("");
    expect(r.MERMAID).toBe("flowchart TD");
  });

  it("handles several missing middle sections in document mode", () => {
    const txt = [
      delim("TITLE"), "t",
      delim("STEPS"), "1. do x",
      delim("ANNOTATIONS"), '{"startLine":1,"endLine":2,"note":"n"}',
    ].join("\n");
    const r = parseSections(txt, DOC_SECTIONS);
    expect(r.TITLE).toBe("t");
    expect(r.OVERVIEW).toBe("");
    expect(r.STEPS).toBe("1. do x");
    expect(r.FLOWCHART).toBe("");
    expect(r.ANNOTATIONS).toContain("startLine");
  });
});

describe("parseSections — document (12 sections)", () => {
  it("round-trips all twelve sections", () => {
    const txt = DOC_SECTIONS.map((s) => `${delim(s)}\nbody-${s}`).join("\n");
    const r = parseSections(txt, DOC_SECTIONS);
    for (const s of DOC_SECTIONS) expect(r[s]).toBe(`body-${s}`);
  });

  it("trims surrounding whitespace", () => {
    const r = parseSections(`${delim("TITLE")}\n   foo   \n\n${delim("OVERVIEW")}\n`, DOC_SECTIONS);
    expect(r.TITLE).toBe("foo");
    expect(r.OVERVIEW).toBe("");
  });

  it("handles 100KB of section content without truncation", () => {
    const big = "x".repeat(100_000);
    const r = parseSections(
      `${delim("TITLE")}\nt\n${delim("OVERVIEW")}\n${big}\n${delim("PURPOSE")}\np`,
      DOC_SECTIONS
    );
    expect(r.OVERVIEW.length).toBe(big.length);
    expect(r.PURPOSE).toBe("p");
  });
});
