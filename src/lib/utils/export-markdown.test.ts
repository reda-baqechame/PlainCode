import { describe, it, expect } from "vitest";
import {
  exportDocumentMarkdown,
  exportDocstrings,
  injectDocstrings,
  type DocumentExportData,
} from "./export-markdown";
import type { ApiEntry } from "@/types/explanation";

const tsEntry: ApiEntry = {
  name: "fetchUserOrders",
  kind: "function",
  signature: "fetchUserOrders(userId: string, opts?: Opts): Promise<Order[]>",
  description: "Returns the orders for the given user.",
  params: [
    { name: "userId", type: "string", description: "the target user", optional: false },
    { name: "opts", type: "Opts", description: "pagination + retry knobs", optional: true },
  ],
  returns: { type: "Promise<Order[]>", description: "resolved order list" },
  throws: [{ type: "FetchError", description: "if the API is unreachable" }],
};

const baseDoc: DocumentExportData = {
  title: "fetchUserOrders — paginated order retrieval",
  overview: "Fetches paginated orders for a user.",
  purpose: "Lets the dashboard show history.",
  apiEntries: [tsEntry],
  steps: "1. Validate\n2. Fetch\n3. Return",
  flowchart: 'flowchart TD\n A["Start"] --> B["Fetch"]',
  sequenceDiagram: "sequenceDiagram\n Client->>Api: fetchUserOrders(userId)",
  dataflow: 'flowchart LR\n In["userId"] --> Out["Order[]"]',
  example: "const o = await fetchUserOrders('u1');",
  edgeCases: "- null userId throws",
  complexity: "O(n) over rows.",
  detectedLanguage: "TypeScript",
};

describe("exportDocumentMarkdown", () => {
  it("starts with the H1 title and includes core sections", () => {
    const md = exportDocumentMarkdown(baseDoc);
    expect(md.startsWith("# fetchUserOrders")).toBe(true);
    expect(md).toContain("## Overview");
    expect(md).toContain("## Purpose");
  });

  it("embeds exactly three mermaid fences", () => {
    const md = exportDocumentMarkdown(baseDoc);
    const fences = md.match(/```mermaid\n[^]*?```/g) ?? [];
    expect(fences.length).toBe(3);
    expect(md).toContain("flowchart TD");
    expect(md).toContain("sequenceDiagram");
    expect(md).toContain("flowchart LR");
  });

  it("renders the API parameter table", () => {
    const md = exportDocumentMarkdown(baseDoc);
    expect(md).toContain("| Name | Type | Description |");
    expect(md).toContain("`userId`");
    expect(md).toContain("`opts?`");
    expect(md).toContain("**Returns:**");
    expect(md).toContain("**Throws**");
  });

  it("tags the usage example fence with the detected language", () => {
    expect(exportDocumentMarkdown(baseDoc)).toContain("```typescript");
  });

  it("omits empty sections rather than emitting empty headings", () => {
    const md = exportDocumentMarkdown({ ...baseDoc, edgeCases: "", complexity: "", example: "" });
    expect(md).not.toContain("## Edge Cases");
    expect(md).not.toContain("## Complexity");
    expect(md).not.toContain("## Usage Example");
  });

  it("escapes pipes and collapses newlines in table cells", () => {
    const md = exportDocumentMarkdown({
      ...baseDoc,
      apiEntries: [{ ...tsEntry, params: [{ name: "x", type: "string|number", description: "a\nb", optional: false }] }],
    });
    expect(md).toContain("string\\|number");
    expect(md).not.toMatch(/a\nb \|/);
  });
});

describe("exportDocstrings", () => {
  it("produces a JSDoc block for TypeScript", () => {
    const out = exportDocstrings([tsEntry], "TypeScript");
    expect(out.startsWith("/**")).toBe(true);
    expect(out).toContain("@param {string} userId");
    expect(out).toContain("@param {Opts} [opts]");
    expect(out).toContain("@returns {Promise<Order[]>}");
    expect(out).toContain("@throws {FetchError}");
  });

  it("produces a Google-style docstring for Python", () => {
    const py: ApiEntry = {
      name: "fetch", kind: "function", signature: "def fetch(user_id: str) -> list",
      description: "Fetches data.",
      params: [{ name: "user_id", type: "str", description: "the user", optional: false }],
      returns: { type: "list", description: "rows" },
      throws: [{ type: "ValueError", description: "if empty" }],
    };
    const out = exportDocstrings([py], "Python");
    expect(out).toContain('"""Fetches data.');
    expect(out).toContain("Args:");
    expect(out).toContain("user_id (str)");
    expect(out).toContain("Returns:");
    expect(out).toContain("Raises:");
  });

  it("falls back to generic comments for unknown languages", () => {
    expect(exportDocstrings([tsEntry], "Brainfuck")).toContain("// ");
  });

  it("returns empty string for no entries", () => {
    expect(exportDocstrings([], "TypeScript")).toBe("");
  });
});

describe("injectDocstrings — TypeScript", () => {
  const src = [
    "export function fetchUserOrders(userId, opts) {",
    "  return db.query(userId);",
    "}",
  ].join("\n");

  it("inserts a JSDoc block above the function definition", () => {
    const r = injectDocstrings(src, [tsEntry], "TypeScript");
    expect(r.injected).toBe(1);
    const lines = r.code.split("\n");
    const fnLine = lines.findIndex((l) => l.includes("function fetchUserOrders"));
    expect(lines[fnLine - 1]).toContain("*/");
    expect(r.code.indexOf("/**")).toBeLessThan(r.code.indexOf("function fetchUserOrders"));
  });

  it("preserves the original function body", () => {
    const r = injectDocstrings(src, [tsEntry], "TypeScript");
    expect(r.code).toContain("return db.query(userId);");
  });

  it("matches indentation of an indented method definition", () => {
    const indented = ["class S {", "  fetchUserOrders(userId, opts) {", "    return 1;", "  }", "}"].join("\n");
    const r = injectDocstrings(indented, [tsEntry], "TypeScript");
    expect(r.injected).toBe(1);
    expect(r.code).toContain("  /**");
  });

  it("reports skipped entries whose definition is not found", () => {
    const r = injectDocstrings("const unrelated = 1;", [tsEntry], "TypeScript");
    expect(r.injected).toBe(0);
    expect(r.skipped).toContain("fetchUserOrders");
    expect(r.code).toBe("const unrelated = 1;");
  });
});

describe("injectDocstrings — Python", () => {
  const py: ApiEntry = {
    name: "fetch", kind: "function", signature: "def fetch(user_id):",
    description: "Fetches data.",
    params: [{ name: "user_id", type: "str", description: "the user", optional: false }],
    returns: { type: "list", description: "rows" },
    throws: [],
  };

  it("inserts the docstring inside the function, after the def line", () => {
    const src = ["def fetch(user_id):", "    return db.get(user_id)"].join("\n");
    const r = injectDocstrings(src, [py], "Python");
    expect(r.injected).toBe(1);
    const lines = r.code.split("\n");
    expect(lines[0]).toBe("def fetch(user_id):");
    expect(lines[1]).toContain('    """Fetches data.');
    expect(r.code).toContain("    return db.get(user_id)");
  });

  it("handles a multi-line signature ending in colon", () => {
    const src = ["def fetch(", "    user_id,", "):", "    return 1"].join("\n");
    const r = injectDocstrings(src, [py], "Python");
    expect(r.injected).toBe(1);
    const lines = r.code.split("\n");
    const colonLine = lines.findIndex((l) => l.trim() === "):");
    expect(lines[colonLine + 1]).toContain('"""Fetches data.');
  });

  it("indents the docstring one level deeper for a method", () => {
    const src = ["class S:", "    def fetch(user_id):", "        return 1"].join("\n");
    const r = injectDocstrings(src, [py], "Python");
    expect(r.injected).toBe(1);
    expect(r.code).toContain('        """Fetches data.');
  });
});

describe("injectDocstrings — guards", () => {
  it("returns code unchanged with no entries", () => {
    const r = injectDocstrings("x = 1", [], "Python");
    expect(r.code).toBe("x = 1");
    expect(r.injected).toBe(0);
  });

  it("returns code unchanged for empty code", () => {
    const r = injectDocstrings("", [tsEntry], "TypeScript");
    expect(r.code).toBe("");
    expect(r.injected).toBe(0);
  });
});
