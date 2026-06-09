import { describe, it, expect } from "vitest";
import { streamStateFromResult } from "./useDocument";
import type { DocumentResult } from "@/types/explanation";

const result: DocumentResult = {
  title: "myFn — does a thing",
  overview: "Overview text.",
  purpose: "Purpose text.",
  apiEntries: [
    {
      name: "myFn",
      kind: "function",
      signature: "myFn(): void",
      description: "does a thing",
      params: [],
      returns: { type: "void", description: "" },
      throws: [],
    },
  ],
  steps: "1. do it",
  flowchart: "flowchart TD\n A-->B",
  sequenceDiagram: "sequenceDiagram\n A->>B: x",
  dataflow: "flowchart LR\n In-->Out",
  example: "myFn()",
  edgeCases: "- none",
  complexity: "O(1)",
  annotations: [{ startLine: 1, endLine: 1, note: "n" }],
  detectedLanguage: "TypeScript",
  confidenceScore: 77,
  layer3Passed: true,
};

describe("streamStateFromResult", () => {
  const s = streamStateFromResult(result);

  it("marks the stream as completed", () => {
    expect(s.done).toBe(true);
    expect(s.loading).toBe(false);
    expect(s.currentSection).toBe("");
  });

  it("maps prose and diagram sections so the panel can render them", () => {
    expect(s.sections.TITLE).toBe(result.title);
    expect(s.sections.OVERVIEW).toBe(result.overview);
    expect(s.sections.FLOWCHART).toContain("flowchart TD");
    expect(s.sections.SEQUENCE).toContain("sequenceDiagram");
    expect(s.sections.DATAFLOW).toContain("flowchart LR");
  });

  it("carries the result and confidence through", () => {
    expect(s.result).toBe(result);
    expect(s.confidence).toBe(77);
  });
});
