import { describe, it, expect } from "vitest";
import {
  parseGitHubRepoUrl,
  sanitizeRepoPath,
  slugifyBranch,
  buildAuthorizeUrl,
} from "./oauth";

describe("parseGitHubRepoUrl", () => {
  it("parses owner/repo from a standard URL", () => {
    expect(parseGitHubRepoUrl("https://github.com/sindresorhus/is-odd")).toEqual({
      owner: "sindresorhus",
      repo: "is-odd",
    });
  });
  it("strips a trailing .git", () => {
    expect(parseGitHubRepoUrl("https://github.com/a/b.git")?.repo).toBe("b");
  });
  it("tolerates extra path segments and trailing slash", () => {
    expect(parseGitHubRepoUrl("https://github.com/a/b/tree/main/")).toEqual({
      owner: "a",
      repo: "b",
    });
  });
  it("rejects non-github hosts", () => {
    expect(parseGitHubRepoUrl("https://gitlab.com/a/b")).toBeNull();
  });
  it("rejects malformed input", () => {
    expect(parseGitHubRepoUrl("not a url")).toBeNull();
    expect(parseGitHubRepoUrl("https://github.com/onlyowner")).toBeNull();
  });
});

describe("sanitizeRepoPath", () => {
  it("accepts normal nested paths", () => {
    expect(sanitizeRepoPath("docs/README.md")).toBe("docs/README.md");
    expect(sanitizeRepoPath("README.md")).toBe("README.md");
  });
  it("normalizes a leading ./ or /", () => {
    expect(sanitizeRepoPath("./docs/x.md")).toBe("docs/x.md");
    expect(sanitizeRepoPath("/abs.md")).toBeNull();
  });
  it("rejects traversal and null bytes", () => {
    expect(sanitizeRepoPath("../etc/passwd")).toBeNull();
    expect(sanitizeRepoPath("a/../../b")).toBeNull();
    expect(sanitizeRepoPath("a\0b")).toBeNull();
  });
  it("rejects empty and overly long paths", () => {
    expect(sanitizeRepoPath("")).toBeNull();
    expect(sanitizeRepoPath("a".repeat(201))).toBeNull();
  });
  it("rejects exotic characters", () => {
    expect(sanitizeRepoPath("docs/$(rm).md")).toBeNull();
    expect(sanitizeRepoPath("docs/a b.md")).toBeNull();
  });
});

describe("slugifyBranch", () => {
  it("produces a namespaced, slugified, unique branch", () => {
    const b = slugifyBranch("Add Documentation (PlainCode)");
    expect(b.startsWith("plaincode-docs/add-documentation-plaincode-")).toBe(true);
  });
  it("falls back to 'docs' for empty titles", () => {
    expect(slugifyBranch("!!!").startsWith("plaincode-docs/docs-")).toBe(true);
  });
  it("yields distinct branches across calls", () => {
    expect(slugifyBranch("x")).not.toBe(slugifyBranch("x"));
  });
});

describe("buildAuthorizeUrl", () => {
  it("includes client_id, redirect_uri, scope and state", () => {
    const url = buildAuthorizeUrl({
      clientId: "cid",
      redirectUri: "https://app/api/github/callback",
      state: "st",
    });
    expect(url.startsWith("https://github.com/login/oauth/authorize?")).toBe(true);
    const q = new URL(url).searchParams;
    expect(q.get("client_id")).toBe("cid");
    expect(q.get("redirect_uri")).toBe("https://app/api/github/callback");
    expect(q.get("scope")).toBe("public_repo");
    expect(q.get("state")).toBe("st");
  });
});
