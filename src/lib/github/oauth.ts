// Pure GitHub helpers — no network, fully unit-testable.

export const GH_TOKEN_COOKIE = "pc_gh_token";
export const GH_STATE_COOKIE = "pc_gh_oauth_state";
export const GH_OAUTH_SCOPE = "public_repo";

export interface RepoRef {
  owner: string;
  repo: string;
}

export function parseGitHubRepoUrl(url: string): RepoRef | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.replace(/^\//, "").replace(/\/$/, "").split("/");
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

// Reject anything that could escape the repo root or hit an unexpected path.
export function sanitizeRepoPath(path: string): string | null {
  // Strip a leading "./" only — never a bare "/", so absolute paths are rejected below.
  const trimmed = path.trim().replace(/^\.\//, "");
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return null;
  if (trimmed.includes("..")) return null;
  if (trimmed.includes("\0")) return null;
  if (trimmed.length > 200) return null;
  // Only allow sane path characters.
  if (!/^[A-Za-z0-9._\-/]+$/.test(trimmed)) return null;
  return trimmed;
}

export function slugifyBranch(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "docs";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `plaincode-docs/${base}-${suffix}`;
}

export function buildAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: opts.scope ?? GH_OAUTH_SCOPE,
    state: opts.state,
    allow_signup: "false",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function isOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
