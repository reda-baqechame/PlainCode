import { describe, it, expect, vi, afterEach } from "vitest";
import { validateFiles, openDocsPullRequest, GitHubCommitError } from "./commit";

describe("validateFiles", () => {
  const ok = [{ path: "docs/x.md", content: "hello" }];

  it("returns sanitized files for valid input", () => {
    expect(validateFiles([{ path: "./docs/x.md", content: "hi" }])).toEqual([
      { path: "docs/x.md", content: "hi" },
    ]);
  });
  it("rejects an empty list", () => {
    expect(() => validateFiles([])).toThrow(GitHubCommitError);
  });
  it("rejects more than five files", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ path: `a${i}.md`, content: "x" }));
    expect(() => validateFiles(many)).toThrow(/Too many/);
  });
  it("rejects traversal paths", () => {
    expect(() => validateFiles([{ path: "../x.md", content: "x" }])).toThrow(/Invalid file path/);
  });
  it("rejects oversized content", () => {
    expect(() => validateFiles([{ path: "a.md", content: "x".repeat(200_001) }])).toThrow(
      /Invalid content/
    );
  });
  it("accepts exactly five files", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ path: `a${i}.md`, content: "x" }));
    expect(validateFiles(five)).toHaveLength(5);
  });
  it("preserves valid content", () => {
    expect(validateFiles(ok)[0].content).toBe("hello");
  });
});

describe("openDocsPullRequest (mocked GitHub API)", () => {
  afterEach(() => vi.restoreAllMocks());

  function mockSequence() {
    const calls: { url: string; method: string }[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET" });
      const json = (body: unknown, status = 200) =>
        ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

      if (url.endsWith("/repos/o/r")) return json({ default_branch: "main" });
      if (url.endsWith("/git/ref/heads/main")) return json({ object: { sha: "base123" } });
      if (url.endsWith("/git/refs") && init?.method === "POST") return json({}, 201);
      // contents GET (does the file exist?) -> 404 so we create fresh
      if (url.includes("/contents/") && (init?.method ?? "GET") === "GET")
        return json({ message: "Not Found" }, 404);
      if (url.includes("/contents/") && init?.method === "PUT") return json({}, 201);
      if (url.endsWith("/pulls") && init?.method === "POST")
        return json({ html_url: "https://github.com/o/r/pull/1" }, 201);
      return json({}, 500);
    });
    vi.stubGlobal("fetch", fetchMock);
    return { calls, fetchMock };
  }

  it("creates a branch, writes the file, and returns the PR url", async () => {
    const { calls } = mockSequence();
    const result = await openDocsPullRequest({
      token: "t",
      owner: "o",
      repo: "r",
      files: [{ path: "docs/x.md", content: "hi" }],
      branch: "plaincode-docs/x-abc123",
      prTitle: "Add docs",
      prBody: "body",
    });
    expect(result.url).toBe("https://github.com/o/r/pull/1");
    // Verify the call order hit each step.
    const methods = calls.map((c) => `${c.method} ${c.url.split("github.com")[1] ?? c.url}`);
    expect(methods.some((m) => m.includes("/git/refs") && m.startsWith("POST"))).toBe(true);
    expect(methods.some((m) => m.includes("/contents/docs/x.md") && m.startsWith("PUT"))).toBe(true);
    expect(methods.some((m) => m.includes("/pulls") && m.startsWith("POST"))).toBe(true);
  });

  it("maps a 404 repo to a 404 GitHubCommitError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }) as Response)
    );
    await expect(
      openDocsPullRequest({
        token: "t",
        owner: "o",
        repo: "r",
        files: [{ path: "x.md", content: "y" }],
        branch: "b",
        prTitle: "t",
        prBody: "",
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("maps a 403 on branch creation to a write-access error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const json = (body: unknown, status = 200) =>
          ({ ok: status < 300, status, json: async () => body }) as Response;
        if (url.endsWith("/repos/o/r")) return json({ default_branch: "main" });
        if (url.endsWith("/git/ref/heads/main")) return json({ object: { sha: "s" } });
        if (url.endsWith("/git/refs") && init?.method === "POST") return json({}, 403);
        return json({}, 500);
      })
    );
    await expect(
      openDocsPullRequest({
        token: "t",
        owner: "o",
        repo: "r",
        files: [{ path: "x.md", content: "y" }],
        branch: "b",
        prTitle: "t",
        prBody: "",
      })
    ).rejects.toMatchObject({ status: 403 });
  });
});
