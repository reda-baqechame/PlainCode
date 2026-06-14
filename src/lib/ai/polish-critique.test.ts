import { describe, it, expect } from "vitest";
import { parseCritique } from "./polish-critique";
import { imageBlockFromDataUrl } from "./polish-analyze";

describe("parseCritique", () => {
  it("parses a clean critique JSON", () => {
    const c = parseCritique(
      `{"score": 88, "looksAI": false, "issues": [{"area":"hero","problem":"x","fix":"y"}], "verdict":"strong"}`
    );
    expect(c.score).toBe(88);
    expect(c.looksAI).toBe(false);
    expect(c.issues).toHaveLength(1);
    expect(c.verdict).toBe("strong");
  });
  it("extracts JSON even when wrapped in prose/fences", () => {
    const c = parseCritique("Here is my review:\n```json\n{\"score\":61,\"looksAI\":true,\"issues\":[],\"verdict\":\"generic\"}\n```\nDone.");
    expect(c.score).toBe(61);
    expect(c.looksAI).toBe(true);
  });
  it("clamps score and tolerates missing fields", () => {
    const c = parseCritique(`{"score": 130}`);
    expect(c.score).toBe(100);
    expect(c.issues).toEqual([]);
    expect(c.looksAI).toBe(false);
  });
});

describe("imageBlockFromDataUrl", () => {
  it("parses a png data URL into a base64 image block", () => {
    const block = imageBlockFromDataUrl("data:image/png;base64,AAAABBBB");
    expect(block?.type).toBe("image");
    expect((block!.source as { media_type: string }).media_type).toBe("image/png");
  });
  it("normalizes jpg → jpeg and rejects non-images", () => {
    expect((imageBlockFromDataUrl("data:image/jpg;base64,AAAA")!.source as { media_type: string }).media_type).toBe("image/jpeg");
    expect(imageBlockFromDataUrl("data:text/plain;base64,AAAA")).toBeNull();
    expect(imageBlockFromDataUrl(undefined)).toBeNull();
  });
});
