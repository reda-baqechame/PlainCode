import { describe, it, expect } from "vitest";
import { sanitizeScreenHtml } from "./polish-render";
import { imageBlockFromDataUrl } from "./polish-analyze";

describe("sanitizeScreenHtml", () => {
  it("strips <script> blocks", () => {
    const out = sanitizeScreenHtml(`<div>ok</div><script>alert(1)</script>`);
    expect(out).not.toContain("<script");
    expect(out).toContain("<div>ok</div>");
  });
  it("strips inline event handlers", () => {
    const out = sanitizeScreenHtml(`<button onclick="steal()">x</button>`);
    expect(out).not.toContain("onclick");
    expect(out).toContain("<button");
  });
  it("neutralizes javascript: URLs", () => {
    const out = sanitizeScreenHtml(`<a href="javascript:evil()">x</a>`);
    expect(out).not.toContain("javascript:");
  });
  it("keeps <style> and normal markup", () => {
    const html = `<style>.a{color:var(--primary)}</style><section class="a">Hi</section>`;
    expect(sanitizeScreenHtml(html)).toBe(html);
  });
});

describe("imageBlockFromDataUrl", () => {
  it("parses a valid png data URL into a base64 image block", () => {
    const block = imageBlockFromDataUrl("data:image/png;base64,AAAABBBB");
    expect(block).not.toBeNull();
    expect(block!.type).toBe("image");
    expect(block!.source.type).toBe("base64");
    expect((block!.source as { media_type: string }).media_type).toBe("image/png");
  });
  it("normalizes image/jpg to image/jpeg", () => {
    const block = imageBlockFromDataUrl("data:image/jpg;base64,AAAA");
    expect((block!.source as { media_type: string }).media_type).toBe("image/jpeg");
  });
  it("returns null for non-image or malformed input", () => {
    expect(imageBlockFromDataUrl(undefined)).toBeNull();
    expect(imageBlockFromDataUrl("not-a-data-url")).toBeNull();
    expect(imageBlockFromDataUrl("data:text/plain;base64,AAAA")).toBeNull();
  });
});
