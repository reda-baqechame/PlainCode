import { describe, it, expect, beforeAll } from "vitest";
import {
  encodeDocumentShare,
  decodeDocumentShare,
  buildDocumentShareUrl,
} from "./share";
import type { DocumentResult } from "@/types/explanation";

// btoa/atob exist in modern Node, but guard for older environments.
beforeAll(() => {
  if (typeof globalThis.btoa === "undefined") {
    globalThis.btoa = (s: string) => Buffer.from(s, "binary").toString("base64");
    globalThis.atob = (s: string) => Buffer.from(s, "base64").toString("binary");
  }
});

const result: DocumentResult = {
  title: "fetchUserOrders — order retrieval",
  overview: "Fetches orders for a user.",
  purpose: "Powers the dashboard.",
  apiEntries: [
    {
      name: "fetchUserOrders",
      kind: "function",
      signature: "fetchUserOrders(id: string): Promise<Order[]>",
      description: "Returns orders.",
      params: [{ name: "id", type: "string", description: "user id", optional: false }],
      returns: { type: "Promise<Order[]>", description: "orders" },
      throws: [],
    },
  ],
  steps: "1. fetch\n2. return",
  flowchart: "flowchart TD\n A-->B",
  sequenceDiagram: "sequenceDiagram\n A->>B: x",
  dataflow: "flowchart LR\n In-->Out",
  example: "await fetchUserOrders('u1')",
  edgeCases: "- null id throws",
  complexity: "O(n)",
  annotations: [{ startLine: 1, endLine: 2, note: "fetch block" }],
  detectedLanguage: "TypeScript",
  confidenceScore: 88,
  layer1Confidence: 90,
  layer3Passed: true,
};

describe("document share encode/decode", () => {
  it("round-trips a full document result", () => {
    const encoded = encodeDocumentShare({ result, isRepo: false });
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = decodeDocumentShare(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.isRepo).toBe(false);
    expect(decoded!.result.title).toBe(result.title);
    expect(decoded!.result.flowchart).toContain("flowchart TD");
    expect(decoded!.result.apiEntries[0].name).toBe("fetchUserOrders");
    expect(decoded!.result.confidenceScore).toBe(88);
  });

  it("preserves the isRepo flag", () => {
    const decoded = decodeDocumentShare(encodeDocumentShare({ result, isRepo: true }));
    expect(decoded!.isRepo).toBe(true);
  });

  it("handles unicode in prose without corruption", () => {
    const uni = { ...result, overview: "Récupère les commandes — 日本語 — café" };
    const decoded = decodeDocumentShare(encodeDocumentShare({ result: uni, isRepo: false }));
    expect(decoded!.result.overview).toBe(uni.overview);
  });

  it("returns null on malformed input instead of throwing", () => {
    expect(decodeDocumentShare("@@@not-base64@@@")).toBeNull();
    expect(decodeDocumentShare("")).toBeNull();
  });

  it("builds a hash-fragment share URL", () => {
    expect(buildDocumentShareUrl("https://x.app", "ABC")).toBe("https://x.app/document#d=ABC");
  });
});
