import { describe, it, expect } from "vitest";
import { sanitizeScreenHtml } from "./polish-draft";

describe("sanitizeScreenHtml", () => {
  it("strips <script> blocks but keeps markup", () => {
    const out = sanitizeScreenHtml(`<div>ok</div><script>alert(1)</script>`);
    expect(out).not.toContain("<script");
    expect(out).toContain("<div>ok</div>");
  });
  it("strips inline event handlers and javascript: URLs", () => {
    expect(sanitizeScreenHtml(`<button onclick="x()">x</button>`)).not.toContain("onclick");
    expect(sanitizeScreenHtml(`<a href="javascript:evil()">x</a>`)).not.toContain("javascript:");
  });
  it("strips code fences and document wrappers, keeping inner style + markup", () => {
    const out = sanitizeScreenHtml(
      "```html\n<!doctype html><html><head><style>.a{color:var(--primary)}</style></head><body><section class=\"a\">Hi</section></body></html>\n```"
    );
    expect(out).not.toMatch(/```/);
    expect(out).not.toMatch(/<\/?(html|head|body)/i);
    expect(out).not.toMatch(/doctype/i);
    expect(out).toContain("<style>.a{color:var(--primary)}</style>");
    expect(out).toContain('<section class="a">Hi</section>');
  });
});
