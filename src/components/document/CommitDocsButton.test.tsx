// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CommitDocsButton } from "./CommitDocsButton";

function mockFetch(handlers: Record<string, (init?: RequestInit) => unknown>) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const key = Object.keys(handlers).find((k) => url.includes(k));
    const body = key ? handlers[key](init) : {};
    return { ok: true, status: 200, json: async () => body } as Response;
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch({ "/api/github/status": () => ({ configured: false, connected: false }) }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CommitDocsButton", () => {
  const props = { repoUrl: "https://github.com/a/b", markdown: "# Docs", defaultPath: "docs/x.md" };

  it("offers the token path when OAuth is not configured", async () => {
    render(<CommitDocsButton {...props} />);
    expect(await screen.findByText(/Use a GitHub token/i)).toBeTruthy();
  });

  it("shows Connect GitHub when OAuth is configured but not connected", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ "/api/github/status": () => ({ configured: true, connected: false }) })
    );
    render(<CommitDocsButton {...props} />);
    expect(await screen.findByText(/Connect GitHub/i)).toBeTruthy();
  });

  it("commits with a pasted token and shows the PR link", async () => {
    const fetchMock = mockFetch({
      "/api/github/status": () => ({ configured: false, connected: false }),
      "/api/document/commit": () => ({ url: "https://github.com/a/b/pull/7" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CommitDocsButton {...props} />);

    // Reveal the token field, enter a token.
    fireEvent.click(await screen.findByText(/Use a GitHub token/i));
    fireEvent.change(screen.getByPlaceholderText(/github_pat_/i), {
      target: { value: "github_pat_abc" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Open docs PR/i }));

    expect(await screen.findByText(/Pull request opened/i)).toBeTruthy();

    // The commit call carried the repo, file content, and the token.
    const commitCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/api/document/commit"));
    expect(commitCall).toBeTruthy();
    const sentBody = JSON.parse((commitCall![1] as RequestInit).body as string);
    expect(sentBody.repoUrl).toBe("https://github.com/a/b");
    expect(sentBody.token).toBe("github_pat_abc");
    expect(sentBody.files[0].content).toBe("# Docs");
  });

  it("surfaces a commit error without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/github/status"))
          return { ok: true, status: 200, json: async () => ({ configured: false, connected: false }) } as Response;
        return { ok: false, status: 403, json: async () => ({ error: "No write access" }) } as Response;
      })
    );
    render(<CommitDocsButton {...props} />);
    fireEvent.click(await screen.findByText(/Use a GitHub token/i));
    fireEvent.change(screen.getByPlaceholderText(/github_pat_/i), { target: { value: "t" } });
    fireEvent.click(screen.getByRole("button", { name: /Open docs PR/i }));
    expect(await screen.findByText(/No write access/i)).toBeTruthy();
  });
});
