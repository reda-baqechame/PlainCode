import { describe, it, expect } from "vitest";
import { sanitizeScreenHtml, parseScreens } from "./polish-render";
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
  it("strips document wrappers but keeps the inner style + markup", () => {
    const out = sanitizeScreenHtml(`<!doctype html><html><head><style>.a{color:var(--primary)}</style></head><body><section class="a">Hi</section></body></html>`);
    expect(out).not.toMatch(/<\/?(html|head|body)/i);
    expect(out).not.toMatch(/doctype/i);
    expect(out).toContain("<style>.a{color:var(--primary)}</style>");
    expect(out).toContain('<section class="a">Hi</section>');
  });
});

describe("parseScreens", () => {
  const text = `<<<SCREEN: Landing>>>
<style>.l{color:var(--primary)}</style><section class="l">Hero</section>
<<<SCREEN: Dashboard>>>
<style>.d{}</style><section class="d">Board</section>
<<<END>>>`;
  it("parses each delimited screen with its name and html", () => {
    const screens = parseScreens(text);
    expect(screens.map((s) => s.name)).toEqual(["Landing", "Dashboard"]);
    expect(screens[0].html).toContain("Hero");
    expect(screens[1].html).toContain("Board");
  });
  it("drops a truncated trailing screen with no real markup", () => {
    const truncated = `<<<SCREEN: Landing>>>
<style>.l{}</style><section>Hero</section>
<<<SCREEN: Dashboard>>>
<styl`;
    const screens = parseScreens(truncated);
    expect(screens.map((s) => s.name)).toEqual(["Landing"]);
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
