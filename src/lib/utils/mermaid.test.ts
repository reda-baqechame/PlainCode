import { describe, it, expect } from "vitest";
import { sanitizeMermaid, stripCodeFences } from "./mermaid";

describe("stripCodeFences", () => {
  it("removes ```mermaid fences", () => {
    expect(stripCodeFences("```mermaid\nflowchart TD\n A-->B\n```")).toBe("flowchart TD\n A-->B");
  });
  it("removes bare ``` fences", () => {
    expect(stripCodeFences("```\nfoo\n```")).toBe("foo");
  });
  it("leaves unfenced text untouched", () => {
    expect(stripCodeFences("flowchart TD")).toBe("flowchart TD");
  });
  it("extracts a fenced block embedded in surrounding prose", () => {
    const raw = "Here is the diagram:\n\n```mermaid\nflowchart TD\n A-->B\n```\n\nHope that helps!";
    expect(stripCodeFences(raw)).toBe("flowchart TD\n A-->B");
  });
});

describe("sanitizeMermaid — flowchart", () => {
  it("preserves a flowchart TD prefix", () => {
    expect(sanitizeMermaid('flowchart TD\n A["Start"] --> B["End"]')).toMatch(/^flowchart TD/);
  });
  it("preserves flowchart LR (data-flow direction)", () => {
    expect(sanitizeMermaid('flowchart LR\n In["x"] --> Out["y"]')).toMatch(/^flowchart LR/);
  });
  it("prepends flowchart TD when no diagram type is present", () => {
    expect(sanitizeMermaid('A["Start"] --> B["End"]')).toMatch(/^flowchart TD\n/);
  });
  it("quotes labels containing special characters", () => {
    expect(sanitizeMermaid("flowchart TD\n A[Process & retry] --> B[Done]")).toContain(
      'A["Process & retry"]'
    );
  });
  it("quotes a label containing parentheses WITHOUT mismatching brackets", () => {
    // Regression: the old combined regex closed on ")" before "]", producing
    // A["foo (bar")] — broken. The fixed per-shape regex must keep [ ] intact.
    const out = sanitizeMermaid("flowchart TD\n A[call fetch(userId)] --> B[done]");
    expect(out).toContain('A["call fetch(userId)"]');
    expect(out).not.toMatch(/"\)\]/); // no stray ") ]" corruption
  });
  it("quotes a decision label with parentheses", () => {
    expect(sanitizeMermaid("flowchart TD\n C{valid(x)?} --> D[ok]")).toContain('C{"valid(x)?"}');
  });
  it("leaves already-quoted labels untouched", () => {
    const src = 'flowchart TD\n A["already (quoted)"] --> B["B"]';
    expect(sanitizeMermaid(src)).toContain('A["already (quoted)"]');
    expect(sanitizeMermaid(src)).not.toContain('A[""');
  });
  it("leaves a plain label without special chars unquoted", () => {
    expect(sanitizeMermaid("flowchart TD\n A[Start] --> B[End]")).toContain("A[Start]");
  });
  it("strips a stray leading 'mermaid' word", () => {
    expect(sanitizeMermaid("mermaid\nflowchart TD\n A-->B")).toMatch(/^flowchart TD/);
  });
});

describe("sanitizeMermaid — sequenceDiagram", () => {
  const seq = [
    "sequenceDiagram",
    "  participant Client",
    "  participant Api",
    "  Client->>Api: fetchUserOrders(userId)",
    "  Api-->>Client: orders[]",
  ].join("\n");

  it("does NOT wrap a sequenceDiagram in flowchart TD", () => {
    expect(sanitizeMermaid(seq)).toMatch(/^sequenceDiagram/);
  });
  it("does NOT corrupt arrow message syntax", () => {
    const out = sanitizeMermaid(seq);
    expect(out).toContain("Client->>Api: fetchUserOrders(userId)");
    expect(out).toContain("Api-->>Client: orders[]");
  });
  it("keeps method-call parentheses inside messages intact", () => {
    expect(sanitizeMermaid("sequenceDiagram\n A->>B: fetch(userId, opts)")).toContain(
      "fetch(userId, opts)"
    );
  });
  it("preserves sequenceDiagram even inside a code fence", () => {
    expect(sanitizeMermaid("```mermaid\n" + seq + "\n```")).toMatch(/^sequenceDiagram/);
  });
});

describe("sanitizeMermaid — other diagram types", () => {
  it("preserves stateDiagram-v2", () => {
    expect(sanitizeMermaid("stateDiagram-v2\n [*] --> Idle")).toMatch(/^stateDiagram-v2/);
  });
  it("preserves classDiagram", () => {
    expect(sanitizeMermaid("classDiagram\n class Foo")).toMatch(/^classDiagram/);
  });
  it("preserves erDiagram", () => {
    expect(sanitizeMermaid("erDiagram\n CUSTOMER ||--o{ ORDER : places")).toMatch(/^erDiagram/);
  });
});

describe("sanitizeMermaid — adversarial", () => {
  it("does not throw on empty input", () => {
    expect(sanitizeMermaid("")).toMatch(/^flowchart TD/);
  });
  it("detects sequenceDiagram after leading whitespace", () => {
    expect(sanitizeMermaid("\n\nsequenceDiagram\n A->>B: x")).toMatch(/^sequenceDiagram/);
  });
});
